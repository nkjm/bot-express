'use strict';

const debug = require("debug")("bot-express:skill");
const request = require("request");
Promise = require("bluebird");
Promise.promisifyAll(request);

/*
** Just forward the original message to Admin User
** Supported messenger is LINE Only.
** Supported message types are text, sticker and location.
*/
const SUPPORTED_MESSENGERS = ["line"];
const SUPPORTED_MESSAGE_TYPES = ["text", "sticker", "location"];

module.exports = class SkillSimpleForward {
    constructor(){
        this.clear_context_on_finish = true;
    }

    finish(bot, event, context, resolve, reject){
        if (SUPPORTED_MESSENGERS.indexOf(bot.type) === -1){
            // We do nothing in case of facebook since in Facebook, Admin can see and reply the messege by Facebook Page.
            debug(`${bot.type} messenger is not supported in simple-forward skill. Supported messenger is LINE only. We just skip processing this event.`);
            return resolve();
        }

        if (SUPPORTED_MESSAGE_TYPES.indexOf(event.message.type) === -1){
            debug(`${event.message.type} message type is not supported in simple-forward skill. Supported message types are text and sticker message type. We just skip processing this event.`);
            return resolve();
        }

        let admin_user_id = process.env.LINE_ADMIN_USER_ID;
        let url = 'https://api.line.me/v2/bot/profile/' + bot.extract_sender_id();
        let headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.LINE_ACCESS_TOKEN
        }

        return request.getAsync({
            url: url,
            headers: headers,
            json: true
        }).then(
            (response) => {
                let messages = [];
                messages.push({
                    type: "text",
                    text: `以下、${response.body.displayName}さんからです。`
                });

                // We copy original message and just remove id.
                let orig_message = JSON.parse(JSON.stringify(event.message));
                delete orig_message.id;

                messages.push(orig_message);
                return bot.send(admin_user_id, messages);
            }
        ).then(
            (response) => {
                return resolve();
            }
        );
    }
};
