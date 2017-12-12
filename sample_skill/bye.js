"use strict";

const debug = require("debug")("bot-express:skill");

/*
** Intended for use of beacon leave event.
*/
module.exports = class SkillBye {
    finish(bot, event, context, resolve, reject){
        let messages = {
            type: "text",
            text: "Bye"
        }
        return bot.reply(messages).then((response) => {
            return resolve(response);
        });
    }
};
