'use strict';

/*
** Import Packages
*/
let Promise = require("bluebird");
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");

module.exports = class BeaconFlow extends Flow {

    constructor(messenger, bot_event, options, beacon_event_type) {
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
            sender_language: null
        };
        messenger.context = context;
        super(messenger, bot_event, context, options);
    }

    run(){
        debug("### This is Beacon Flow. ###");

        // Will collect missing parameter or run the final action.
        return super.finish();
    } // End of run()
};
