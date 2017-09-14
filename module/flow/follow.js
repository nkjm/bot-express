'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");
let Nlp = require("../nlp");

module.exports = class FollowFlow extends Flow {

    constructor(messenger, bot_event, options) {
        let context = {
            _flow: "follow",
            intent: {name: options.follow_skill},
            confirmed: {},
            to_confirm: [],
            confirming: null,
            previous: {
                confirmed: [],
                message: []
            },
            _message_queue: [],
            sender_language: null
        };
        messenger.context = context;
        super(messenger, bot_event, context, options);
    }

    run(){
        debug("### This is Follow Flow. ###");

        // Will collect missing parameter or run the final action.
        return super.finish();
    } // End of run()
};
