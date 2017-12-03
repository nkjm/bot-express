"use strict";

const debug = require("debug")("bot-express:skill");

/*
** Just reply the text response provided from api.ai.
*/
module.exports = class SkillSimpleResponse {
    finish(bot, event, context, resolve, reject){
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
