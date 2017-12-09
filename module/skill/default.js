'use strict';

const debug = require("debug")("bot-express:skill");

module.exports = class SkillDefault {
    finish(bot, bot_event, context, resolve, reject){
        debug(`Going to reply "${context.intent.text_response}".`);
        let messages = [{
            text: context.intent.text_response
        }];
        return bot.reply(messages).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
