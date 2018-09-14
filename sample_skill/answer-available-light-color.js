"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillAnswerAvailableLightColor {

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: "利用できるライトの色は青、赤、黄でございます。"
        })
    }
};
