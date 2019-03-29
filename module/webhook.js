"use strict";

const crypto = require("crypto");
Promise = require("bluebird");

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

// Import Messenger Abstraction.
const Messenger = require("./messenger");

/**
Webhook to receive all request from messenger.
@class
*/
class Webhook {
    constructor(logger, memory, options){
        this.logger = logger;
        this.memory = memory;
        this.options = options;
        this.messenger;
    }

    /**
     * Initialize context.
     * @method
     * @param {String} flow
     * @param {Object} event
     * @return {context}
     */
    init_context(flow, event){
        const context = {
            chat_id: crypto.randomBytes(20).toString('hex'),
            launched_at: new Date().getTime(),
            intent: null,
            confirmed: {},
            to_confirm: [],
            confirming: null,
            confirming_property: null,
            heard: {},
            event: event,
            previous: {
                event: null,
                intent: [],
                confirmed: [],
                processed: [],
                message: []
            },
            sender_language: null,
            skill: null,
            translation: null,
            _flow: flow,
            _message_queue: [],
            _in_progress: false,
            _pause: false,
            _exit: false,
            _init: false,
            _digging: false,
            _switch_intent: null
        }
        return context;
    }

    /**
    Main function.
    @returns {Promise.<context>}
    */
    async run(){
        debug("Webhook runs.");

        // Identify messenger.
        if (this.options.req.get("X-Line-Signature") && this.options.req.body.events){
            this.options.messenger_type = "line";
        } else if (this.options.req.get("X-Hub-Signature") && this.options.req.body.object == "page"){
            this.options.messenger_type = "facebook";
        } else if (this.options.req.get("google-actions-api-version")){
            this.options.messenger_type = "google";
        } else {
            debug(`This event comes from unsupported message platform. Skip processing.`);
            return;
        }
        debug(`Messenger is ${this.options.messenger_type}`);

        // Check if required configuration has been set for this messenger.
        if (!this.options.messenger[this.options.messenger_type]){
            debug(`bot-express has not been configured to handle message from ${this.options.messenger_type} so we skip this event.`);
            return;
        }

        // Instantiate messenger instance.
        this.messenger = new Messenger(this.options);
        debug("Messenger instantiated.");

        // Validate Signature
        await this.messenger.validate_signature(this.options.req);
        debug("Signature validation succeeded.");

        // Refresh token.
        await this.messenger.refresh_token();
        debug("Refresh token succeeded.");

        // Process events
        let events = this.messenger.extract_events(this.options.req.body);
        let done_process_events = [];
        for (let e of events){
            done_process_events.push(this.process_event(e));
        }
        const context_list = await Promise.all(done_process_events);

        for (let context of context_list){
            if (typeof context === "object"){
                debug("Updated context follows.");
                debug(JSON.stringify(context));
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
        if (this.messenger.type === "line" && (event.replyToken == "00000000000000000000000000000000" || event.replyToken == "ffffffffffffffffffffffffffffffff")){
            debug(`This is webhook validation so skip processing.`);
            return;
        }

        // Identify memory id.
        let memory_id;
        if (this.messenger.identify_event_type(event) === "bot-express:push"){
            memory_id = this.messenger.extract_to_id(event);
        } else {
            memory_id = this.messenger.extract_sender_id(event);
        }
        debug(`memory id is ${memory_id}.`);

        // Get context from memory.
        let context = await this.memory.get(memory_id);

        // Ignore parallel event to prevent unexpected behavior by double tap.
        if (context && 
            context._in_progress && 
            this.options.parallel_event == "ignore" && 
            this.messenger.identify_event_type(event) != "bot-express:push"
        ){
            context._in_progress = false; // To avoid lock out, we ignore event only once.
            await this.memory.put(memory_id, context);
            debug(`Bot is currenlty processing another event from this user so ignore this event.`);
            return;
        }

        // Make in progress flag
        if (context){
            context._in_progress = event;
            await this.memory.put(memory_id, context);
        } else {
            await this.memory.put(memory_id, { _in_progress: event });
        }

        let flow;
        let event_type = this.messenger.identify_event_type(event);
        debug(`event type is ${event_type}.`);

        if (["follow", "unfollow", "join", "leave"].includes(event_type)) {
            // Active Event Flow
            if (!this.options.skill[event_type]){
                debug(`This is active event flow for ${event_type} event but ${event_type}_skill not found so skip.`);
                context._in_progress = false;
                await this.memory.put(memory_id, context);
                return;
            }

            context = this.init_context(event_type, event);
            context.intent = {
                name: this.options.skill[event_type]
            }
            flow = new flows["active_event"](this.options, this.logger, this.messenger, event, context);
        } else if (event_type == "beacon"){
            // Beacon Flow
            let beacon_event_type = this.messenger.extract_beacon_event_type(event);

            if (!beacon_event_type){
                debug(`Unsupported beacon event so we skip this event.`);
                context._in_progress = false;
                await this.memory.put(memory_id, context);
                return;
            }
            if (!this.options.skill.beacon || !this.options.skill.beacon[beacon_event_type]){
                debug(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`);
                context._in_progress = false;
                await this.memory.put(memory_id, context);
                return;
            }
            debug(`This is beacon flow and we use ${this.options.skill.beacon[beacon_event_type]} as skill`);

            context = this.init_context("beacon", event);
            context.intent = {
                name: this.options.skill.beacon[beacon_event_type]
            }
            flow = new flows[event_type](this.options, this.logger, this.messenger, event, context);
        } else if (event_type == "bot-express:push"){
            // Push Flow
            context = this.init_context("push", event);
            flow = new flows["push"](this.options, this.logger, this.messenger, event, context);
        } else if (!context || !context.intent){
            // Start Conversation Flow
            context = this.init_context("start_conversation", event);
            flow = new flows["start_conversation"](this.options, this.logger, this.messenger, event, context);
        } else {
            if (context.confirming){
                // Reply flow
                context._flow = "reply";
                flow = new flows["reply"](this.options, this.logger, this.messenger, event, context);
            } else {
                // BTW Flow
                context._flow = "btw";
                flow = new flows["btw"](this.options, this.logger, this.messenger, event, context);
            }
        }

        let updated_context;
        try {
            updated_context = await flow.run();
        } catch (e){
            const chat_id = (context && context.chat_id) ? context.chat_id : "unknown_chat_id";
            const skill_type = (context && context.skill && context.skill.type) ? context.skill.type : "unknown_skill";
            await this.logger.skill_status(memory_id, chat_id, skill_type, "abended", {
                error: e,
                context: context
            });

            // Clear memory.
            debug("Clearing context");
            await this.memory.del(memory_id);
            
            throw e;
        }

        // Switch skill if flag is on.
        if (updated_context && updated_context._switch_intent) {
            debug(`Switching skill corresponding to "${updated_context._switch_intent.name}" intent.`);

            // Save intent to switch before clean up.
            const intent = updated_context._switch_intent;

            if (updated_context._clear){
                debug("Clearing context");
                await this.memory.del(memory_id);
            } else {
                // Turn off all flag to cleanup context for next skill.
                debug("Turn off all flag to cleanup context for next skill.");
                updated_context._pause = false;
                updated_context._exit = false;
                updated_context._init = false;
                updated_context._clear = false;
                updated_context._switch_intent = false;
                updated_context._in_progress = false;

                await this.memory.put(memory_id, updated_context);
            }

            updated_context = await this.process_event({
                type: "postback",
                replyToken: event.replyToken,
                source: event.source,
                timestamp: Date.now(),
                postback: {
                    data: JSON.stringify({
                        _type: "intent",
                        intent: intent,
                        language: updated_context.sender_language
                    })
                }
            })
        }

        // Update memory.
        if (!updated_context || updated_context._clear){
            debug("Clearing context");
            await this.memory.del(memory_id);
        } else {
            // Delete skill from context except for skill name since we need this in skill-status logging.
            const skill_type = updated_context.skill.type;
            delete updated_context.skill;
            updated_context.skill = {
                type: skill_type
            }

            updated_context._in_progress = false;
            updated_context.previous.event = event;

            debug("Updating context");
            await this.memory.put(memory_id, updated_context);
        }

        return updated_context;
    }
}

module.exports = Webhook;
