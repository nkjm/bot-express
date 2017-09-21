'use strict';

let Promise = require('bluebird');
let debug = require('debug')('bot-express:skill');
let app_env = require("../environment_variables");
let rightnow = require("../sample_service/rightnow.js");

module.exports = class SkillRealHumanReply {

    constructor(){
        this.required_parameter = {
            answer: {
                message_to_confirm: {
                    text: "OK. 答えプリーズ"
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (!error){
                        if (app_env.FAQ_CONFIRM_AUTO_LEARN == "enable"){
                            bot.collect("auto_learn");
                        }
                    }
                    return resolve();
                }
            }
        }

        this.optional_parameter = {
            auto_learn: {
                message_to_confirm: {
                    text: "このQ&A、登録しておきますか？",
                    quick_replies: [
                        {content_type:"text", title:"はい", payload:"はい"},
                        {content_type:"text", title:"いいえ", payload:"いいえ"},
                    ]
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

        let user_id = first_message_text.split("$$")[1].trim();
        let question = first_message_text.split("$$")[2].trim();

        // Promise List.
        let tasks = [];

        // ### Tasks Overview ###
        // -> Register a new FAQ answer.
        // -> Reply the answer to original user.
        // -> Reply to administrator. Just say OK.

        // Register new FAQ answer.
        if (context.confirmed.auto_learn == undefined || context.confirmed.auto_learn == "はい"){
            let rn_answer = {
                summary: question,
                question: "<div>" + question + "</div>\n",
                solution: "<div>" + context.confirmed.answer + "</div>\n",
                products: [{
                    lookupName: app_env.RN_PRODUCT
                }],
                categories: [{
                    lookupName: app_env.RN_CATEGORY
                }],
                accessLevels: [{
                    lookupName: "全員"
                }],
                answerType: {
                    lookupName: "HTML"
                },
                language: {
                    lookupName: "ja_JP"
                },
                statusWithType: {
                    status: {
                        lookupName: "公開"
                    }
                }
            }
            tasks.push(rightnow.create_answer(rn_answer));
        }

        // Send the answer to original user.
        tasks.push(bot.send(user_id, {
            text: "さっきの質問、わかりました。" + context.confirmed.answer
        }));

        // -> Reply to administrator. Just say OK.
        let message_text;
        if (context.confirmed.auto_learn == undefined || context.confirmed.auto_learn == "はい"){
            message_text = "了解。Q&A登録とユーザーへの回答しておきますー。"
        } else {
            message_text = "了解。ユーザーへ回答しておきますー。"
        }
        tasks.push(bot.reply({
            text: message_text
        }));

        return Promise.all(tasks).then(
            (response) => {
                return resolve();
            }
        )
    }
};
