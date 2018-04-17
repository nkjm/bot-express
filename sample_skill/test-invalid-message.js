"use strict";

module.exports = class SkillTestInvalidMessage {
    finish(bot, event, context, resolve, reject){
        let message = {
            type: "template",
            altText: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            template: {
                type: "buttons",
                text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1", // exceeds 1 letter.
                actions: [{type: "message", label: "test", text: "test"}]
            }
        }
        return bot.reply(message).then((response) => {
            return resolve();
        }).catch((e) => {
            reject(e);
        })
    }
}
