"use strict";

const debug = require("debug")("bot-express:skill");
const Promise = require("bluebird");

class SkillTestParallelEvent {
    async finish(bot, event, context){
        await Promise.resolve().delay(3000);
        
        await bot.reply({
            type: "text",
            text: "done"
        });
    }
}

module.exports = SkillTestParallelEvent;
