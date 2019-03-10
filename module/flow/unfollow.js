"use strict";

Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("../flow");

module.exports = class UnfollowFlow extends Flow {

    constructor(options, logger, messenger, event, context) {
        super(options, logger, messenger, event, context);
    }

    async run(){
        debug("### This is Unfollow Flow. ###");

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message()
        });

        // Log skill status.
        await this.logger.skill_status(this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "launched", {
            context: this.context
        });

        await super.begin();
        return super.finish();
    }
};
