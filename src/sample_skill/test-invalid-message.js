"use strict";

module.exports = class SkillTestInvalidMessage {
    async finish(bot, event, context){
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
        await bot.reply(message);
    }
}
