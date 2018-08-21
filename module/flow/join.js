"use strict";

/*
** Import Packages
*/
Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");

module.exports = class JoinFlow extends Flow {

    constructor(messenger, event, options) {
        let context = {
            _flow: "join",
            intent: {name: options.join_skill},
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
        debug("### This is Join Flow. ###");

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message()
        });

        await super.begin();
        return await super.finish();
    }
};
