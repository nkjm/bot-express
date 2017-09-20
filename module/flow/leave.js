'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");

module.exports = class leaveFlow extends Flow {

    constructor(messenger, bot_event, options) {
        let context = {
            _flow: "join",
            intent: {name: options.leave_skill},
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
        debug("### This is Leave Flow. ###");

        return super.begin().then(
            (response) => {
                return super.finish();
            }
        );
    }
};
