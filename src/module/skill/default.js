"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillDefault {
    async finish(bot, event, context){
        let message;
        if (context.intent.fulfillment && context.intent.fulfillment.length > 0){
            let offset = Math.floor(Math.random() * (context.intent.fulfillment.length));
            message = context.intent.fulfillment[offset];
        } else {
            debug("Fulfillment not found so we do nothing.");
            return;
        }

        await bot.reply(message);
    }
};
