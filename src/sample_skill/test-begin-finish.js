"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillBeginFinish {
    constructor(){
        this.required_parameter = {
            name: {
                message_to_confirm: {
                    type: "text",
                    text: "お名前を教えてください。"
                }
            }
        }
    }

    async begin(bot, event, context){
        bot.queue({
            type: "text",
            text: "ようこそ私を召喚くださいました。"
        });
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: `${context.confirmed.name}さん、さようなら。`
        });
    }
}
