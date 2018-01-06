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

    begin(bot, event, context, resolve, reject){
        bot.queue({
            type: "text",
            text: "ようこそ私を召喚くださいました。"
        });
        return resolve();
    }

    finish(bot, event, context, resolve, reject){
        return bot.reply({
            type: "text",
            text: `${context.confirmed.name}さん、さようなら。`
        }).then((response) => {
            return resolve();
        })
    }
}
