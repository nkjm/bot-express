"use strict";

const debug = require("debug")("bot-express:skill");
const bot_user = require("../sample_service/bot-user");
Promise = require("bluebird");

/*
** Just forward the original message to all users.
** Supported message types are text, sticker and location.
*/
const SUPPORTED_MESSENGERS = ["line", "facebook"];
const SUPPORTED_MESSAGE_TYPES = ["text", "sticker", "location"];

module.exports = class SkillBroadcast {
    constructor(){
        this.required_parameter = {
            message_text: {
                message_to_confirm: {
                    type: "text",
                    text: "はい、メッセージをどうぞ。"
                }
            }
        }
    }

    async finish(bot, event, context){
        if (SUPPORTED_MESSENGERS.indexOf(bot.type) === -1){
            debug(`${bot.type} messenger is not supported in broadcast skill. Supported messenger is LINE only. We just skip processing this event.`);
            return;
        }

        if (SUPPORTED_MESSAGE_TYPES.indexOf(event.message.type) === -1){
            debug(`${event.message.type} message type is not supported in broadcast skill. Supported message types are text and sticker message type. We just skip processing this event.`);
            return;
        }

        let line_user_ids = [];
        let facebook_user_ids = [];

        let users = await bot_user.get_list();

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

        // Send message to LINE users.
        if (line_user_ids.length > 0){
            sent_messages.push(
                bot.compile_message(orig_message, "line").then(
                    async (response) => {
                        debug("Going to multicast following message.");
                        debug(response);
                        await bot.line.multicast(event, line_user_ids, response);
                    }
                )
            );
        }

        // Send message to Facebook users.
        if (facebook_user_ids.length > 0){
            sent_messages.push(
                bot.compile_message(orig_message, "facebook").then(
                    (response) => {
                        return bot.facebook.multicast(event, facebook_user_ids, response);
                    }
                )
            );
        }

        await Promise.all(sent_messages);

        await bot.reply({
            type: "text",
            text: line_user_ids.length + "人のLINEユーザー、および" + facebook_user_ids.length + "人のFacebookユーザーにメッセージを送信しました。"
        })
    }
}
