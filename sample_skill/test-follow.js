"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillFollow {
    constructor(){
        this.clear_context_on_finish = false;
    }
    finish(bot, event, context, resolve, reject){
        return bot.reply({
            type: "text",
            text: "Welcome."
        }).then(
            (response) => {
                return resolve();
            }
        )
    }
}
