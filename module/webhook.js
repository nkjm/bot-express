"use strict";

const Context = require("./context");

// Debuggers
const debug = require("debug")("bot-express:webhook");

// Import Flows
const flows = {
    beacon: require('./flow/beacon'),
    active_event: require('./flow/active_event'),
    start_conversation: require('./flow/start_conversation'),
    reply: require('./flow/reply'),
    btw: require('./flow/btw'),
    push: require('./flow/push')
}

/**
 * Webhook to receive all request from messenger.
 * @class
 */
class Webhook {
    /**
     * @constructor
     * @param {Object} options - Configurations. 
     * @param {Object} slib - Context free libraries.
     */
    constructor(options, slib){
        this.options = options;
        this.slib = slib;
    }

    /**
     * Main function.
     * @returns {Promise.<context>}
     */
    async run(body){
        debug("Webhook runs.");

        // Refresh token. This does not necessarily refresh token but retrieve access token from cache.
        await this.slib.messenger.refresh_token();

        // Process events.
        let events = this.slib.messenger.extract_events(body);
        let done_process_events = [];
        for (let e of events){
            done_process_events.push(this.process_event(e));
        }
        const context_list = await Promise.all(done_process_events);

        // Log context.
        for (let context of context_list){
            if (typeof context === "object"){
                debug("Updated context follows.");
                const context_for_log = Context.remove_buffer(context)
                if (!this.options.log_global){
                    delete context_for_log.global
                }
                debug(context_for_log)
            }
        }

        if (context_list && context_list.length === 1){
            return context_list[0];
        } else {
            return context_list;
        }
    }

    /**
    Process events
    @param {Object} - Event object.
    @returns {Promise.<context>}
    */
    async process_event(event){
        debug(`Processing following event.`);
        debug(JSON.stringify(event));

        // If this is for webhook validation, we skip processing this.
        if (this.slib.messenger.type === "line" && (event.replyToken == "00000000000000000000000000000000" || event.replyToken == "ffffffffffffffffffffffffffffffff")){
            debug(`This is webhook validation so skip processing.`)
            return
        }

        // Identify memory id.
        let memory_id;
        if (this.slib.messenger.identify_event_type(event) === "bot-express:push"){
            memory_id = this.slib.messenger.extract_to_id(event);
        } else {
            memory_id = this.slib.messenger.extract_sender_id(event);
        }
        debug(`memory id is ${memory_id}.`);

        // Get context from memory.
        let context = await this.slib.memory.get(memory_id);

        // Ignore parallel event to prevent unexpected behavior by double tap.
        if (context && 
            context._in_progress && 
            this.options.parallel_event == "ignore" && 
            this.slib.messenger.identify_event_type(event) != "bot-express:push"
        ){
            context._in_progress = false; // To avoid lock out, we ignore event only once.
            await this.slib.memory.put(memory_id, context);
            debug(`Bot is currenlty processing another event from this user so ignore this event.`);
            return;
        }

        // Make in progress flag
        if (context){
            context._in_progress = event;
            await this.slib.memory.put(memory_id, context);
        } else {
            await this.slib.memory.put(memory_id, { _in_progress: event });
        }

        let flow;
        let event_type = this.slib.messenger.identify_event_type(event);
        debug(`event type is ${event_type}.`);

        if (["follow", "unfollow", "join", "leave"].includes(event_type)) {
            // Active Event Flow
            if (!this.options.skill[event_type]){
                debug(`This is active event flow for ${event_type} event but ${event_type}_skill not found so skip.`);
                if (context){
                    context._in_progress = false;
                    await this.slib.memory.put(memory_id, context);
                } else {
                    await this.slib.memory.put(memory_id, { _in_progress: false });
                }
                return;
            }

            context = new Context({ flow: event_type, event: event });

            context.intent = {
                name: this.options.skill[event_type]
            }
            flow = new flows["active_event"](this.options, this.slib, event, context);
        } else if (event_type == "beacon"){
            // Beacon Flow
            let beacon_event_type = this.slib.messenger.extract_beacon_event_type(event);

            if (!beacon_event_type){
                debug(`Unsupported beacon event so we skip this event.`);
                context._in_progress = false;
                await this.slib.memory.put(memory_id, context);
                return;
            }
            if (!this.options.skill.beacon || !this.options.skill.beacon[beacon_event_type]){
                debug(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`);
                context._in_progress = false;
                await this.slib.memory.put(memory_id, context);
                return;
            }
            debug(`This is beacon flow and we use ${this.options.skill.beacon[beacon_event_type]} as skill`);

            context = new Context({ flow: "beacon", event: event });
            context.intent = {
                name: this.options.skill.beacon[beacon_event_type]
            }
            flow = new flows[event_type](this.options, this.slib, event, context);
        } else if (event_type == "bot-express:push"){
            // Push Flow
            // We keep context only if it exists and event.clear_context is false.
            if (context && event && event.clear_context === false){
                context._flow = "push"
                context.event = event
            } else {
                context = new Context({ flow: "push", event: event });
            }
            flow = new flows["push"](this.options, this.slib, event, context);
        } else if (!context || !context.intent){
            // Start Conversation Flow
            context = new Context({ flow: "start_conversation", event: event });
            flow = new flows["start_conversation"](this.options, this.slib, event, context);
        } else {
            if (context.confirming){
                // Reply flow
                context._flow = "reply";
                flow = new flows["reply"](this.options, this.slib, event, context);
            } else {
                // BTW Flow
                context._flow = "btw";
                flow = new flows["btw"](this.options, this.slib, event, context);
            }
        }

        let updated_context;
        try {
            updated_context = await flow.run();
        } catch (e){
            // Run on_abend() of current skill.
            if (context && context.skill && context.skill.on_abend && typeof context.skill.on_abend === "function" && flow && flow.bot){
                debug(`Found on_abend function in ${context.skill.type} skill. Running it..`)
                await context.skill.on_abend(e, flow.bot, event, context)
            }

            const chat_id = (context && context.chat_id) ? context.chat_id : "unknown_chat_id";
            const skill_type = (context && context.skill && context.skill.type) ? context.skill.type : "unknown_skill";

            // Log abend.
            await this.slib.logger.skill_status(flow.bot.extract_channel_id(), memory_id, chat_id, skill_type, "abended", {
                error: e,
                context: context
            });

            // Clear memory.
            debug("Clearing context");
            await this.slib.memory.del(memory_id);
            
            throw e;
        }

        // Switch skill if flag is on.
        if (updated_context && updated_context._switch_intent) {
            debug(`Switching skill corresponding to "${updated_context._switch_intent.name}" intent.`);

            // Save intent to switch before clean up.
            const intent = updated_context._switch_intent;

            if (updated_context._clear){
                debug("Clearing context");
                await this.slib.memory.del(memory_id);
            } else {
                // Turn off all flag to cleanup context for next skill.
                debug("Turn off all flag to cleanup context for next skill.");
                updated_context._pause = false;
                updated_context._exit = false;
                updated_context._init = false;
                updated_context._clear = false;
                updated_context._switch_intent = false;
                updated_context._in_progress = false;

                await this.slib.memory.put(memory_id, updated_context, flow.bot);
            }

            // We use intent postback usually but in case of this event is bot-express:push, we use bot-express:push as well.
            let new_event
            if (event.type === "bot-express:push"){
                new_event = {
                    type: "bot-express:push",
                    to: event.to,
                    timestamp: Date.now(),
                    intent: intent,
                    language: updated_context.sender_language
                }
            } else {
                new_event = {
                    type: "postback",
                    replyToken: event.replyToken,
                    source: event.source,
                    timestamp: Date.now(),
                    postback: {
                        data: JSON.stringify({
                            type: "intent",
                            intent: intent,
                            language: updated_context.sender_language
                        })
                    }
                }
            }
            updated_context = await this.process_event(new_event)
        }

        // Update memory.
        if (!updated_context || updated_context._clear){
            debug("Clearing context");
            await this.slib.memory.del(memory_id);
        } else {
            updated_context._in_progress = false;
            updated_context.previous.event = event;

            debug("Updating context");
            await this.slib.memory.put(memory_id, updated_context, flow.bot);
        }

        return updated_context
    }
}

module.exports = Webhook;
