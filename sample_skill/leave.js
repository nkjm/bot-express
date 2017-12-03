"use strict";

const debug = require("debug")("bot-express:skill");
const bot_user = require("../sample_service/bot-user");
const request = require("request");
Promise = require("bluebird");
Promise.promisifyAll(request);

/*
** Register user to database.
** Supported messenger is LINE Only.
*/
const SUPPORTED_MESSENGERS = ["line"];

module.exports = class SkillLeave {
    constructor(){
        this.clear_context_on_finish = true;
    }

    finish(bot, event, context, resolve, reject){
        if (SUPPORTED_MESSENGERS.indexOf(bot.type) === -1){
            debug(`${bot.type} messenger is not supported in leave skill. Supported messenger is LINE only. We just skip processing this event.`);
            return resolve();
        }

        return bot_user.delete(bot.extract_sender_id()).then(
            (response) => {
                return resolve();
            }
        )
    }
}
