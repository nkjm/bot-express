"use strict";

const debug = require("debug")("bot-express:skill");

/*
** Intended for use of beacon leave event.
*/
module.exports = class SkillBye {
    finish(bot, event, context, resolve, reject){
        debug(`Going to reply "Bye".`);
        let messages = [{
            text: "Bye"
        }];
        return bot.reply(messages).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
