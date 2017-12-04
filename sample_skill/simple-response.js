"use strict";

const debug = require("debug")("bot-express:skill");

/*
** Just reply the text response provided from NLU.
*/
module.exports = class SkillSimpleResponse {

    finish(bot, event, context, resolve, reject){
        let message;
        if (context.intent.fulfillment && context.intent.fulfillment.messages && context.intent.fulfillment.messages.length > 0){
            let offset = Math.floor(Math.random() * (context.intent.fulfillment.messages.length));
            if (context.intent.fulfillment.messages[offset].type === 0){
                message = {
                    type: "text",
                    text: context.intent.fulfillment.messages[offset].speech
                }
            } else if (context.intent.fulfillment.messages[offset].type === 4){
                // Set payload to message as it is.
                message = context.intent.fulfillment.messages[offset].payload;
            }
        }
        return bot.reply(message).then((response) => {
            return resolve();
        });
    }
};
