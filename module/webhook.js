'use strict';

const REQUIRED_OPTIONS = {
    line: ["line_channel_secret", "line_channel_access_token"],
    facebook: ["facebook_app_secret", "facebook_page_access_token"]
}

// Import NPM Packages
const Promise = require("bluebird");
const memory = require("memory-cache");
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
    btw: require('./flow/btw')
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
    }

    /**
    Main function.
    @param {Object} req - HTTP Request from messenger.
    @returns {Promise.<context>}
    */
    run(req){
        debug("Webhook runs.\n\n");

        // FOR TEST PURPOSE ONLY: Clear Memory.
        if (process.env.BOT_EXPRESS_ENV == "test" && req.clear_memory){
            debug(`Deleting memory of ${req.clear_memory}`);
            memory.del(req.clear_memory);
            return Promise.resolve({
                message: "memory cleared",
                memory_id: req.clear_memory
            });
        }

        // Identify Message Platform.
        if (req.get("X-Line-Signature") && req.body.events){
            this.options.message_platform_type = "line";
        } else if (req.get("X-Hub-Signature") && req.body.object == "page"){
            this.options.message_platform_type = "facebook";
        } else {
            debug(`This event comes from unsupported message platform. Skip processing.`);
            return Promise.resolve(null);
        }
        debug(`Message Platform is ${this.options.message_platform_type}`);

        // Check if required options for this message platform are set.
        for (let req_opt of REQUIRED_OPTIONS[this.options.message_platform_type]){
            if (typeof this.options[req_opt] == "undefined"){
                debug(`Required option: ${req_opt} is missing.`);
                return Promise.reject({
                    reason: "required option missing",
                    missing_option: req_opt
                });
            }
        }
        debug("Message Platform specific required options all set.");

        // Instantiate messenger instance.
        let messenger = new Messenger(this.options);
        debug("Messenger Abstraction instantiated.");

        // Signature Validation.
        if (!messenger.validate_signature(req)){
            return Promise.reject("Signature Validation failed.");
        }
        debug("Signature Validation suceeded.");

        // Set Events.
        let bot_events = messenger.extract_events(req.body);

        for (let bot_event of bot_events){
            debug(`Processing following event.`);
            debug(bot_event);

            messenger.bot_event = bot_event;

            // Recall Memory
            let memory_id = messenger.extract_sender_id();
            debug(`memory id is ${memory_id}.`);

            let context = memory.get(memory_id);
            messenger.context = context;

            let promise_flow_completed;
            let flow;
            let event_type = messenger.identify_event_type();
            debug(`evet type is ${event_type}.`);

            if (["follow", "unfollow", "join", "leave"].includes(event_type)) {
                // ### Follow | Unfollow | Join | Leave Flow ###

                if (!this.options[event_type + "_skill"]){
                    debug(`This is ${event_type} flow but ${event_type}_skill not found so skip.`);
                    return Promise.resolve();
                }

                try {
                    flow = new flows[event_type](messenger, bot_event, this.options);
                } catch(err) {
                    return Promise.reject(err);
                }
                promise_flow_completed = flow.run();

                // ### Follow | Unfollow | Join | Leave Flow ###
            } else if (event_type == "beacon"){
                // ### Beacon Flow ###

                let beacon_event_type = messenger.extract_beacon_event_type();

                if (!beacon_event_type){
                    debug(`Unsupported beacon event so we skip this event.`);
                    return Promise.resolve();
                }
                if (!this.options.beacon_skill || !this.options.beacon_skill[beacon_event_type]){
                    debug(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`);
                    return Promise.resolve();
                }
                debug(`This is beacon flow and we use ${this.options.beacon_skill[beacon_event_type]} as skill`);

                messenger.context = context;
                try {
                    flow = new flows[event_type](messenger, bot_event, this.options, beacon_event_type);
                } catch(err) {
                    return Promise.reject(err);
                }
                promise_flow_completed = flow.run();

                // ### Beacon Flow ###
            } else if (!context){
                // ### Start Conversation Flow ###

                try {
                    flow = new flows["start_conversation"](messenger, bot_event, this.options);
                } catch(err) {
                    return Promise.reject(err);
                }
                promise_flow_completed = flow.run();

                // ### Start Conversation Flow ###
            } else {
                if (context.confirming){
                    // ### Reply Flow ###

                    try {
                        flow = new flows["reply"](messenger, bot_event, context, this.options);
                    } catch(err){
                        return Promise.reject(err);
                    }
                    promise_flow_completed = flow.run();

                    // ### Reply Flow ###
                } else {
                    // ### BTW Flow ###

                    try {
                        flow = new flows["btw"](messenger, bot_event, context, this.options);
                    } catch(err){
                        return Promise.reject(err);
                    }
                    promise_flow_completed = flow.run();

                    // ### BTW Flow ###
                }
            }

            // Triggers on completion of Flow
            return promise_flow_completed.then(
                (context) => {
                    debug("Successful End of Flow.");

                    // Update memory.
                    memory.put(memory_id, context, this.options.memory_retention);

                    return context;
                },
                (response) => {
                    debug("Abnormal End of Flow.");

                    // Clear memory.
                    memory.del(memory_id);

                    return Promise.reject(response);
                }
            ); // End of Completion of Flow

        }; // End of Process Event
    }
}

module.exports = Webhook;
