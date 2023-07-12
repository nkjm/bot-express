"use strict";

const debug = require("debug")("bot-express:skill");

/*
** Just reply the text response provided from api.ai.
*/
module.exports = class SkillCancel {
    constructor(){
        this.clear_context_on_finish = true;
    }

    async finish(bot, event, context){
        debug(`Going to reply "${context.intent.text_response}".`);
        let message = {
            text: context.intent.text_response
        };
        await bot.reply(message);
    }
};
