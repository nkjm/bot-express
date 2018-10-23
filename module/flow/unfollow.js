"use strict";

/*
** Import Packages
*/

Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");
const log = require("../logger");

module.exports = class UnfollowFlow extends Flow {
    /*
    ** ### Unfollow Flow ###
    ** -> Run final action.
    */

    constructor(messenger, event, options) {
        let context = {
            _flow: "unfollow",
            intent: {name: options.skill.unfollow},
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
        debug("### This is Unfollow Flow. ###");

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
