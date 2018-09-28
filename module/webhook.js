"use strict";

const REQUIRED_OPTIONS = {
    line: ["channel_id", "channel_secret"],
    facebook: ["facebook_app_secret", "facebook_page_access_token"],
    google: ["project_id"]
}

// Import NPM Packages
Promise = require("bluebird");

// Debuggers
const debug = require("debug")("bot-express:webhook");
const log = require("./logger");

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

/**
Webhook to receive all request from messenger.
@class
*/
class Webhook {
    constructor(options){
        this.options = options;
        this.memory = options.memory;
        this.messenger;
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
        if (!["test", "development"].includes(process.env.BOT_EXPRESS_ENV)){
            await this.messenger.refresh_token();
        }
        debug("Messenger instantiated.");

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
        //await this.memory.close();

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

        if (context && context._in_progress && this.options.parallel_event == "ignore" && this.messenger.identify_event_type(event) != "bot-express:push"){
            context._in_progress = false; // To avoid lock out, we ignore event only once.
            await this.memory.put(memory_id, context);
            debug(`Bot is currenlty processing another event from this user so ignore this event.`);
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
            if (!this.options.skill[event_type]){
                debug(`This is ${event_type} flow but ${event_type}_skill not found so skip.`);
                return;
            }

            flow = new flows[event_type](this.messenger, event, this.options);
        } else if (event_type == "beacon"){
            // ### Beacon Flow ###
            let beacon_event_type = this.messenger.extract_beacon_event_type(event);

            if (!beacon_event_type){
                debug(`Unsupported beacon event so we skip this event.`);
                return;
            }
            if (!this.options.skill.beacon || !this.options.skill.beacon[beacon_event_type]){
                debug(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`);
                return;
            }
            debug(`This is beacon flow and we use ${this.options.skill.beacon[beacon_event_type]} as skill`);

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
            if (context && context.skill){
                log.skill_status(memory_id, context.skill.type, "abend", context.confirming);
            }

            // Clear memory.
            debug("Clearing context");
            await this.memory.del(memory_id);
            
            throw e;
        }

        // Update memory.
        if (!updated_context){
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
