"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillDefault {
    finish(bot, event, context, resolve, reject){
        debug("We could not identify intent so use builtin-default skill which uses fulfillment of the intent response as message.");

        let message;
        if (context.intent.fulfillment && context.intent.fulfillment.length > 0){
            let offset = Math.floor(Math.random() * (context.intent.fulfillment.length));
            if (context.intent.fulfillment[offset].text){
                message = {
                    type: "text",
                    text: context.intent.fulfillment[offset].text.text[0]
                }
            } else if (context.intent.fulfillment[offset].payload){
                // Set payload to message as it is.
                message = {};
                for (let property of Object.keys(context.intent.fulfillment[offset].payload.fields)){
                    if (context.intent.fulfillment[offset].payload.fields[property] && context.intent.fulfillment[offset].payload.fields[property].kind){
                        message[property] = context.intent.fulfillment[offset].payload.fields[property][context.intent.fulfillment[offset].payload.fields[property].kind];
                    }
                }
                if (!message.type){
                    throw new Error("Unknown message type");
                }
            } else {
                throw new Error("Unknown fulfillment");
            }

        } else {
            debug("Fulfillment not found so we do nothing.");
            return resolve();
        }

        return bot.reply(message).then((response) => {
            return resolve();
        });
    }
};
