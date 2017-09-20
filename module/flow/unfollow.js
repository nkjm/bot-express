'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");

module.exports = class UnfollowFlow extends Flow {
    /*
    ** ### Unfollow Flow ###
    ** -> Run final action.
    */

    constructor(messenger, bot_event, options) {
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
            sender_language: null
        };
        messenger.context = context;
        super(messenger, bot_event, context, options);
    }

    run(){
        debug("### This is Unfollow Flow. ###");

        return super.begin().then(
            (response) => {
                return super.finish();
            }
        );
    }
};
