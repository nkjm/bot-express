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

module.exports = class SkillRegistration {
    constructor(){
        this.clear_context_on_finish = true;
    }

    async finish(bot, event, context){
        if (SUPPORTED_MESSENGERS.indexOf(bot.type) === -1){
            // We do nothing in case of facebook since in Facebook, Admin can see and reply the messege by Facebook Page.
            debug(`${bot.type} messenger is not supported in registration skill. Supported messenger is LINE only. We just skip processing this event.`);
            return;
        }

        let url = 'https://api.line.me/v2/bot/profile/' + bot.extract_sender_id();
        let headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.LINE_ACCESS_TOKEN
        }
        
        const response = await request.getAsync({
            url: url,
            headers: headers,
            json: true
        })

        let user = {
            messenger: "line",
            user_id: response.body.userId,
            display_name: response.body.displayName,
            picture_url: response.body.pictureUrl
        }
        
        await bot_user.save(user);
    }
}
