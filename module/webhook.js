'use strict';

const REQUIRED_OPTIONS = {
    line: ["line_channel_secret", "line_channel_access_token"],
    facebook: ["facebook_app_secret", "facebook_page_access_token"]
}

// Import NPM Packages
const Promise = require("bluebird");
//const memory = require("memory-cache");
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
    btw: require('./flow/btw')
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
    }

    /**
    Main function.
    @param {Object} req - HTTP Request from messenger.
    @returns {Promise.<context>}
    */
    run(req){
        debug("Webhook runs.\n\n");

        memory = new Memory(this.options.memory);

        // FOR TEST PURPOSE ONLY: Clear Memory.
        if (process.env.BOT_EXPRESS_ENV == "test" && req.clear_memory){
            debug(`Deleting memory of ${req.clear_memory}`);

            return Promise.resolve().then((response) => {
                return memory.del(req.clear_memory);
            }).then((response) => {
                return {
                    message: "memory cleared",
                    memory_id: req.clear_memory
                }
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
        let events = messenger.extract_events(req.body);

        for (let event of events){
            debug(`Processing following event.`);
            debug(event);

            messenger.event = event;

            // If this is for webhook validation, we skip processing this.
            if(messenger.type == "line" && event.replyToken == "00000000000000000000000000000000"){
                debug("This is webhook validation so skip processing.");
                return Promise.resolve();
            }

            /**
            * Overview of Webhook Promise Chain

            1. Get memory.
            2. Run flow.
            3. Update memory.
            **/

            let promise_flow_completed;

            // Recall Memory
            let memory_id = messenger.extract_sender_id();
            debug(`memory id is ${memory_id}.`);

            promise_flow_completed = Promise.resolve().then((response) => {
                return memory.get(memory_id);
            }).then((context) => {
                messenger.context = context;

                let flow;
                let event_type = messenger.identify_event_type();
                debug(`evet type is ${event_type}.`);

                if (["follow", "unfollow", "join", "leave"].includes(event_type)) {
                    // ### Follow | Unfollow | Join | Leave Flow ###

                    if (!this.options[event_type + "_skill"]){
                        return Promise.reject(new BotExpressWebhookSkip(`This is ${event_type} flow but ${event_type}_skill not found so skip.`));
                    }

                    try {
                        flow = new flows[event_type](messenger, event, this.options);
                    } catch(err) {
                        return Promise.reject(err);
                    }
                    return flow.run();

                    // ### Follow | Unfollow | Join | Leave Flow ###
                } else if (event_type == "beacon"){
                    // ### Beacon Flow ###

                    let beacon_event_type = messenger.extract_beacon_event_type();

                    if (!beacon_event_type){
                        return Promise.reject(new BotExpressWebhookSkip(`Unsupported beacon event so we skip this event.`));
                    }
                    if (!this.options.beacon_skill || !this.options.beacon_skill[beacon_event_type]){
                        return Promise.reject(new BotExpressWebhookSkip(`This is beacon flow but beacon_skill["${beacon_event_type}"] not found so skip.`));
                    }
                    debug(`This is beacon flow and we use ${this.options.beacon_skill[beacon_event_type]} as skill`);

                    messenger.context = context;
                    try {
                        flow = new flows[event_type](messenger, event, this.options, beacon_event_type);
                    } catch(err) {
                        return Promise.reject(err);
                    }
                    return flow.run();

                    // ### Beacon Flow ###
                } else if (!context){
                    // ### Start Conversation Flow ###

                    try {
                        flow = new flows["start_conversation"](messenger, event, this.options);
                    } catch(err) {
                        return Promise.reject(err);
                    }
                    return flow.run();

                    // ### Start Conversation Flow ###
                } else {
                    if (context.confirming){
                        // ### Reply Flow ###

                        try {
                            flow = new flows["reply"](messenger, event, context, this.options);
                        } catch(err){
                            return Promise.reject(err);
                        }
                        return flow.run();

                        // ### Reply Flow ###
                    } else {
                        // ### BTW Flow ###

                        try {
                            flow = new flows["btw"](messenger, event, context, this.options);
                        } catch(err){
                            return Promise.reject(err);
                        }
                        return flow.run();

                        // ### BTW Flow ###
                    }
                }
            });


            // Triggers on completion of Flow
            return promise_flow_completed.then((context) => {
                debug("Successful End of Flow.");

                // Update memory.
                return memory.put(memory_id, context).then((response) => {
                    return context;
                });
            }).catch((error) => {
                if (error.name == "BotExpressWebhookSkip"){
                    debug(error.message);
                    return;
                }

                debug("Abnormal End of Flow.");
                // Clear memory.
                return memory.del(memory_id).then((response) => {
                    return Promise.reject(error);
                });
            }); // End of Completion of Flow

        }; // End of Process Event
    }
}

module.exports = Webhook;
