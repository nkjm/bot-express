"use strict";

require("dotenv").config();

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
    run(){
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
            return Promise.resolve(null);
        }
        debug(`Messenger is ${this.options.messenger_type}`);

        // Check if required options for this message platform are set.
        for (let req_opt of REQUIRED_OPTIONS[this.options.messenger_type]){
            if (typeof this.options[req_opt] == "undefined"){
                debug(`Required option: ${req_opt} is missing.`);
                return Promise.reject({
                    reason: "required option missing",
                    missing_option: req_opt
                });
            }
        }
        debug("Messenger specific required options all set.");

        // Instantiate messenger instance.
        this.messenger = new Messenger(this.options);
        debug("Messenger abstraction instantiated.");

        /**
        * Overview of Webhook Promise Chain
        1. Validate signature
        2. Process events
          2-1. Recall memory
          2-2. Run flow
          2-3. Update memory
        3. Return contexts
        **/

        return Promise.resolve().then(() => {
            // Validate Signature
            return this.messenger.validate_signature(this.options.req);
        }).then(() => {
            debug("Signature validation succeeded.");
            // Process events
            let events = this.messenger.extract_events(this.options.req.body);
            return this.process_events(events);
        }).then((responses) => {
            if (responses && responses.length === 1){
                return responses[0];
            } else {
                return responses;
            }
        }).catch((error) => {
            return Promise.reject(error);
        }).finally((response) => {
            return this.memory.close().then(() => {
                return response;
            })
        })
    }


    /**
    Process events.
    @param {Array.<Object>} - Array of event object.
    @returns {Promise}
    */
    process_events(events){
        let done_process_events = [];
        events.forEach((event) => {
            done_process_events.push(this.process_event(event));
        })
        return Promise.all(done_process_events);
    }

    /**
    Process events
    @param {Object} - Event object.
    @returns {Promise}
    */
    process_event(event){
        debug(`Processing following event.`);
        debug(event);

        // If this is for webhook validation, we skip processing this.
        if (this.messenger.type === "line" && (event.replyToken == "00000000000000000000000000000000" || event.replyToken == "ffffffffffffffffffffffffffffffff")){
            debug("This is webhook validation so skip processing.");
            return Promise.resolve();
        }

        // Recall Memory
        let memory_id;
        if (this.messenger.identify_event_type(event) === "bot-express:push"){
            memory_id = this.messenger.extract_to_id(event);
        } else {
            memory_id = this.messenger.extract_sender_id(event);
        }
        debug(`memory id is ${memory_id}.`);

        // Run flow.
        let done_flow = Promise.resolve().then((response) => {
            return this.memory.get(memory_id);
        }).then((context) => {
            let flow;
            let event_type = this.messenger.identify_event_type(event);
            debug(`event type is ${event_type}.`);

            if (["follow", "unfollow", "join", "leave"].includes(event_type)) {
                // ### Follow | Unfollow | Join | Leave Flow ###
                if (!this.options[event_type + "_skill"]){
                    return Promise.reject(new BotExpressWebhookSkip(`This is ${event_type} flow but ${event_type}_skill not found so skip.`));
                }

                try {
                    flow = new flows[event_type](this.messenger, event, this.options);
                } catch(err) {
                    return Promise.reject(err);
                }
                return flow.run();
            } else if (event_type == "beacon"){
                // ### Beacon Flow ###
                let beacon_event_type = this.messenger.extract_beacon_event_type(event);

                if (!beacon_event_type){
                    return Promise.reject(new BotExpressWebhookSkip(`Unsupported beacon event so we skip this event.`));
                }
                if (!this.options.beacon_skill || !this.options.beacon_skill[beacon_event_type]){
                    return Promise.reject(new BotExpressWebhookSkip(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`));
                }
                debug(`This is beacon flow and we use ${this.options.beacon_skill[beacon_event_type]} as skill`);

                try {
                    flow = new flows[event_type](this.messenger, event, this.options, beacon_event_type);
                } catch(err) {
                    return Promise.reject(err);
                }
                return flow.run();
            } else if (event_type == "bot-express:push"){
                // ### Push Flow ###
                try {
                    flow = new flows["push"](this.messenger, event, this.options);
                } catch(err) {
                    return Promise.reject(err);
                }
                return flow.run();
            } else if (!context){
                // ### Start Conversation Flow ###
                try {
                    flow = new flows["start_conversation"](this.messenger, event, this.options);
                } catch(err) {
                    return Promise.reject(err);
                }
                return flow.run();
            } else {
                if (context.confirming){
                    // ### Reply Flow ###
                    try {
                        flow = new flows["reply"](this.messenger, event, context, this.options);
                    } catch(err){
                        return Promise.reject(err);
                    }
                    return flow.run();
                } else {
                    // ### BTW Flow ###
                    try {
                        flow = new flows["btw"](this.messenger, event, context, this.options);
                    } catch(err){
                        return Promise.reject(err);
                    }
                    return flow.run();
                }
            }
        });

        // Update memory.
        let done_update_memory = done_flow.then((context) => {
            debug("Successful End of Flow.");

            // Update memory.
            if (!context){
                return this.memory.del(memory_id).then((response) => {
                    debug("Clearing context");
                    return null;
                })
            } else {
                delete context.skill;
                return this.memory.put(memory_id, context).then((response) => {
                    debug("Updating context");
                    return context;
                })
            }
        }).catch((error) => {
            if (error.name == "BotExpressWebhookSkip"){
                debug(error.message);
                return;
            }

            debug("Abnormal End of Flow.");
            // Clear memory.
            return this.memory.del(memory_id).then((response) => {
                debug("Context cleared.");
                return Promise.reject(error);
            });
        })

        return done_update_memory;
    }
}

module.exports = Webhook;
