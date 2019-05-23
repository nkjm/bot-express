"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillAnswerAvailableLightColor {
    constructor(){
        this.required_parameter = {
            param_a: {
                message: {
                    type: "text",
                    text: "Param A?"
                }
            }
        }
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: "利用できるライトの色は青、赤、黄でございます。"
        })
    }
};
