"use strict";

/*
** Import Packages
*/
Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");

module.exports = class BeaconFlow extends Flow {

    constructor(messenger, event, options, beacon_event_type) {
        // Instantiate the conversation object. This will be saved as Bot Memory.
        let context = {
            _flow: "beacon",
            intent: {name: options.beacon_skill[beacon_event_type]},
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
        debug("### This is Beacon Flow. ###");

        return super.begin().then(
            (response) => {
                return super.finish();
            }
        );
    }
};
