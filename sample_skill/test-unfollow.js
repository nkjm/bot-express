"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillUnfollow {
    finish(bot, event, context, resolve, reject){
        return bot.reply([{
            type: "text",
            text: "Bye."
        }]).then(
            (response) => {
                return resolve();
            }
        )
    }
}
