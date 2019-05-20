"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillRobotResponse {
    constructor(){
        this.clear_context_on_finish = true;
    }

    async finish(bot, event, context){
        let message;
        if (context.intent.fulfillment && context.intent.fulfillment.length > 0){
            let offset = Math.floor(Math.random() * (context.intent.fulfillment.length));
            message = context.intent.fulfillment[offset];
        } else {
            debug("Fulfillment not found so we do nothing.");
            return;
        }

        if (message.type == "text" && message.text && bot.translator && context.sender_language != "ja"){
            message.text = await bot.translator.translate(message.text, context.sender_language);
        }

        await bot.reply(message);
    }
}
