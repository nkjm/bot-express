"use strict";

const REQUIRED_OPTIONS = {
    line: ["line_channel_secret", "line_access_token"],
    facebook: ["facebook_app_secret", "facebook_page_access_token"],
    google: ["google_project_id"]
}

// Import NPM Packages
Promise = require("bluebird");

const Memory = require("./memory");
const debug = require("debug")("bot-express:webhook");

// Import Flows
const flows = {
    beacon: require('./flow/beacon'),
    follow: require('./flow/follow'),
    unfollow: require('./flow/unfollow'),
    join: require('./flow/join'),
    leave: require('./flow/leave'),
    start_conversation: require('./flow/start_conversation'),
    reply: require('./flow/reply'),
    btw: require('./flow/btw'),
    push: require('./flow/push')
}

// Import Messenger Abstraction.
const Messenger = require("./messenger");

const BotExpressWebhookSkip = require("./error/webhook");

/**
Webhook to receive all request from messenger.
@class
*/
class Webhook {
    constructor(options){
        this.options = options;
        this.memory = new Memory(options.memory);
        this.messenger;
    }

    /**
    Main function.
    @returns {Promise.<context>}
    */
    async run(){
        debug("Webhook runs.\n\n");

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

        // Check if required options for this message platform are set.
        for (let req_opt of REQUIRED_OPTIONS[this.options.messenger_type]){
            if (typeof this.options[req_opt] == "undefined"){
                throw new Error(`Required option: ${req_opt} is missing.`);
            }
        }
        debug("Messenger specific required options all set.");

        // Instantiate messenger instance.
        this.messenger = new Messenger(this.options);
        debug("Messenger abstraction instantiated.");

        // Validate Signature
        try {
            await this.messenger.validate_signature(this.options.req);
        } catch(e){
            debug(`Signature validation failed.`);
            throw e;
        }

        debug("Signature validation succeeded.");

        // Process events
        let events = this.messenger.extract_events(this.options.req.body);

        let done_process_events = [];
        for (let e of events){
            done_process_events.push(this.process_event(e));
        }
        let responses = await Promise.all(done_process_events);

        // Close memory connection.
        await this.memory.close();

        if (responses && responses.length === 1){
            return responses[0];
        } else {
            return responses;
        }
    }

    /**
    Process events
    @param {Object} - Event object.
    @returns {Promise}
    */
    async process_event(event){
        debug(`Processing following event.`);
        debug(JSON.stringify(event));

        // If this is for webhook validation, we skip processing this.
        if (this.messenger.type === "line" && (event.replyToken == "00000000000000000000000000000000" || event.replyToken == "ffffffffffffffffffffffffffffffff")){
            debug(`This is webhook validation so skip processing.`);
            return;
        }

        // Identify memory id
        let memory_id;
        if (this.messenger.identify_event_type(event) === "bot-express:push"){
            memory_id = this.messenger.extract_to_id(event);
        } else {
            memory_id = this.messenger.extract_sender_id(event);
        }
        debug(`memory id is ${memory_id}.`);


        let context = await this.memory.get(memory_id);

        if (context && context._in_progress && this.options.parallel_event == "ignore"){
            context._in_progress = false; // To avoid lock out, we ignore event only once.
            await this.memory.put(memory_id, context);
            debug(`Bot is currenlty processing another event from this user so ignore this event.`);
            //throw new BotExpressWebhookSkip(`Bot is currenlty processing another event from this user so ignore this event.`);
            return;
        }

        // Make in progress flag
        if (context){
            context._in_progress = true;
            await this.memory.put(memory_id, context);
        } else {
            await this.memory.put(memory_id, { _in_progress: true });
        }

        let flow;
        let event_type = this.messenger.identify_event_type(event);
        debug(`event type is ${event_type}.`);

        if (["follow", "unfollow", "join", "leave"].includes(event_type)) {
            // ### Follow | Unfollow | Join | Leave Flow ###
            if (!this.options[event_type + "_skill"]){
                debug(`This is ${event_type} flow but ${event_type}_skill not found so skip.`);
                return;
                //return Promise.reject(new BotExpressWebhookSkip(`This is ${event_type} flow but ${event_type}_skill not found so skip.`));
            }

            flow = new flows[event_type](this.messenger, event, this.options);
        } else if (event_type == "beacon"){
            // ### Beacon Flow ###
            let beacon_event_type = this.messenger.extract_beacon_event_type(event);

            if (!beacon_event_type){
                debug(`Unsupported beacon event so we skip this event.`);
                return;
                //return Promise.reject(new BotExpressWebhookSkip(`Unsupported beacon event so we skip this event.`));
            }
            if (!this.options.beacon_skill || !this.options.beacon_skill[beacon_event_type]){
                debug(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`);
                return;
                //return Promise.reject(new BotExpressWebhookSkip(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`));
            }
            debug(`This is beacon flow and we use ${this.options.beacon_skill[beacon_event_type]} as skill`);

            flow = new flows[event_type](this.messenger, event, this.options, beacon_event_type);
        } else if (event_type == "bot-express:push"){
            // ### Push Flow ###
            flow = new flows["push"](this.messenger, event, this.options);
        } else if (!context || !context.intent){
            // ### Start Conversation Flow ###
            flow = new flows["start_conversation"](this.messenger, event, this.options);
        } else {
            if (context.confirming){
                // ### Reply flow ###
                flow = new flows["reply"](this.messenger, event, context, this.options);
            } else {
                // ### BTW Flow ###
                flow = new flows["btw"](this.messenger, event, context, this.options);
            }
        }

        let updated_context;
        try {
            updated_context = await flow.run();
        } catch (e){
            debug("Abnormal End of Flow.");
            // Clear memory.
            debug("Clearing context");
            return await this.memory.del(memory_id);
            throw e;
        }

        // Update memory.
        if (!updated_context){
            debug("Clearing context");
            await this.memory.del(memory_id);
        } else {
            delete updated_context.skill;
            updated_context._in_progress = false;
            debug("Updating context");
            await this.memory.put(memory_id, updated_context);
        }

        return updated_context;
    }
}

module.exports = Webhook;
