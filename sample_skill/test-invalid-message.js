"use strict";

module.exports = class SkillTestInvalidMessage {
    finish(bot, event, context, resolve, reject){
        let message = {
            type: "template",
            altText: "test",
            template: {
                type: "buttons",
                title: "this title exceeds the threshold aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                text: "test",
                actions: [{type: "message", label: "test", text: "test"}]
            }
        }
        return bot.reply(message).then((response) => {
            return resolve();
        })
    }
}
