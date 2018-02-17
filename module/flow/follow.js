"use strict";

/*
** Import Packages
*/
Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");

module.exports = class FollowFlow extends Flow {

    constructor(messenger, event, options) {
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
            sender_language: null,
            translation: null
        };
        super(messenger, event, context, options);
    }

    run(){
        debug("### This is Follow Flow. ###");

        return super.begin().then((response) => {
            return super.finish();
        });
    }
};
