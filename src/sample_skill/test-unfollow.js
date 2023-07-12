"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillUnfollow {
    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: "Bye."
        });
    }
}
