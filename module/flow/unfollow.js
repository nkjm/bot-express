"use strict";

/*
** Import Packages
*/

Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");
const log = require("../logger");

module.exports = class UnfollowFlow extends Flow {

    constructor(options, messenger, event, context) {
        super(options, messenger, event, context);
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
