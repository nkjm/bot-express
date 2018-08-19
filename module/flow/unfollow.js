"use strict";

/*
** Import Packages
*/

Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");

module.exports = class UnfollowFlow extends Flow {
    /*
    ** ### Unfollow Flow ###
    ** -> Run final action.
    */

    constructor(messenger, event, options) {
        let context = {
            _flow: "unfollow",
            intent: {name: options.unfollow_skill},
            confirmed: {},
            to_confirm: [],
            confirming: null,
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

        await super.begin();
        return await super.finish();
    }
};
