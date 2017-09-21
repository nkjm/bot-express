'use strict';

let Promise = require('bluebird');
let debug = require('debug')('bot-express:skill');
let app_env = require("../environment_variables");

module.exports = class SkillSimpleReply {

    constructor(bot, bot_event){
        this.required_parameter = {
            body: {
                message_to_confirm: {
                    text: "OK. 本文プリーズ"
                }
            },
            user_id: {
                message_to_confirm: {
                    text: "ユーザーIDをプリーズ"
                }
            }
        }

        this.clear_context_on_finish = true;
    }

    finish(bot, bot_event, context, resolve, reject){
        let first_message = context.previous.message[context.previous.message.length - 1];

        let first_message_text;
        if (bot.type == "line"){
            first_message_text = first_message.message.data;
        } else if (bot.type == "facebook"){
            first_message_text = first_message.message.payload;
        }

        // Promise List.
        let tasks = [];

        // ### Tasks Overview ###
        // -> Send message to original user.
        // -> Reply to administrator. Just say OK.


        // -> Reply to original user.
        tasks.push(bot.send(context.confirmed.user_id, {
            text: context.confirmed.body
        }));

        // -> Reply to administrator. Just say OK.
        tasks.push(bot.reply({
            text: "了解。ユーザーへ返信しておきますー。"
        }));

        return Promise.all(tasks).then(
            (response) => {
                return resolve();
            }
        )
    }
};
