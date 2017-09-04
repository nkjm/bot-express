"use strict";

let debug = require("debug")("bot-express:skill");
let bot_user = require("../sample_service/bot-user");
let app_env = require("../environment_variables");
let Promise = require("bluebird");

/*
** Just forward the original message to all users.
** Supported message types are text, sticker and location.
*/
const SUPPORTED_MESSENGERS = ["line", "facebook"];
const SUPPORTED_MESSAGE_TYPES = ["text", "sticker", "location"];

module.exports = class SkillBroadcast {
    constructor(bot, event){
        this.required_parameter = {
            message_text: {
                message_to_confirm: {
                    type: "text",
                    text: "はい、メッセージをどうぞ。"
                }
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        if (SUPPORTED_MESSENGERS.indexOf(bot.type) === -1){
            debug(`${bot.type} messenger is not supported in broadcast skill. Supported messenger is LINE only. We just skip processing this event.`);
            return resolve();
        }

        if (SUPPORTED_MESSAGE_TYPES.indexOf(event.message.type) === -1){
            debug(`${event.message.type} message type is not supported in broadcast skill. Supported message types are text and sticker message type. We just skip processing this event.`);
            return resolve();
        }

        let line_user_ids = [];
        let facebook_user_ids = [];
        bot_user.get_list().then(
            (users) => {
                // Create target user list based on messenger. !!!! We need to call multicast every 150 users. !!!!
                for (let user of users){
                    // Skip myself.
                    if (user.user_id == bot.extract_sender_id()){
                        continue;
                    }
                    if (user.messenger == "line"){
                        line_user_ids.push(user.user_id);
                    } else if (user.messenger == "facebook"){
                        facebook_user_ids.push(user.user_id);
                    }
                }

                // We copy original message and just remove id.
                let orig_message = JSON.parse(JSON.stringify(event.message));
                delete orig_message.id;

                let sent_messages = [];

                debug(Object.getOwnPropertyNames(bot.sdk));
                debug(bot.sdk);

                // Send message to LINE users.
                sent_messages.push(
                    bot.compile_message(orig_message, "line").then(
                        (response) => {
                            return bot.sdk.line.multicast(line_user_ids, response);
                        }
                    )
                );

                // Send message to Facebook users.
                sent_messages.push(
                    bot.compile_message(orig_message, "facebook").then(
                        (response) => {
                            return bot.sdk.facebook.multicast(facebook_user_ids, response);
                        }
                    )
                );

                return Promise.all(sent_messages);
            }
        ).then(
            (response) => {
                return bot.reply([{
                    type: "text",
                    text: line_user_ids.length + "人のLINEユーザー、および" + facebook_user_ids.length + "人のFacebookユーザーにメッセージを送信しました。"
                }]);
            },
            (response) => {
                debug(response);
                return bot.reply([{
                    type: "text",
                    text: "メッセージの送信に失敗しました。"
                }]);
            }
        ).then(
            (response) => {
                return resolve();
            }
        )
    }
}
