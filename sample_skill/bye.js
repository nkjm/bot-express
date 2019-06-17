"use strict";

const debug = require("debug")("bot-express:skill");

/*
** Intended for use of beacon leave event.
*/
module.exports = class SkillBye {
    constructor(){
        this.clear_context_on_finish = false
    }

    async finish(bot, event, context){
        let messages = {
            type: "text",
            text: "Bye"
        }
        await bot.reply(messages);
    }
};
