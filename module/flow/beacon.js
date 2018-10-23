"use strict";

/*
** Import Packages
*/
Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");
const log = require("../logger");

module.exports = class BeaconFlow extends Flow {

    constructor(messenger, event, options, beacon_event_type) {
        // Instantiate the conversation object. This will be saved as Bot Memory.
        let context = {
            _flow: "beacon",
            intent: {name: options.skill.beacon[beacon_event_type]},
            confirmed: {},
            to_confirm: [],
            confirming: null,
            event: event,
            previous: {
                confirmed: [],
                message: []
            },
            _message_queue: [],
            sender_language: null,
            translation: null
        };
        super(messenger, event, context, options);
    }

    async run(){
        debug("### This is Beacon Flow. ###");

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message()
        });

        // Log skill status.
        log.skill_status(this.bot.extract_sender_id(), this.context.skill.type, "launched");

        await super.begin();
        return super.finish();
    }
};
