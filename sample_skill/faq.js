"use strict";

require("dotenv").config();

const striptags = require('striptags');
const debug = require('debug')('bot-express:skill');
const rightnow = require('../sample_service/rightnow');

Promise = require('bluebird');

module.exports = class SkillFaq {

    constructor(){
        this.required_parameter = {
            question: {
                message_to_confirm: {
                    type: "text",
                    text: "どうぞ。"
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error){
                        bot.change_message_to_confirm("question", {
                            type: "text",
                            text: "質問をどうぞ。"
                        });
                        return resolve();
                    }

                    if (process.env.FAQ_MODE == "human"){ // This is Human Only Mode.
                        debug("Human mode reaction.");

                        let tasks = [];

                        // ### Task Overview ###
                        // -> Send pending to user.
                        // -> Send help to administrator.

                        // -> Send pending to user.
                        tasks.push(bot.queue([{text: "ちょっと調べてみますね。少々お待ちを。"}]));

                        // -> Send help to administrator.
                        tasks.push(this.need_help(bot, "ユーザーから質問です。", bot.extract_sender_id(), value));

                        return Promise.all(tasks).then(
                            (response) => {
                                return resolve();
                            }
                        );
                    } else if (process.env.FAQ_MODE == "hybrid"){ // This is Hybrid Mode by Robot and Human.
                        debug("Hybrid mode reaction.");
                        return rightnow.bot_search_answer(value, process.env.RN_PRODUCT).then(
                            (response) => {
                                // Save interacion id for later rating.
                                context.confirmed.interaction_id = response.interaction_id;

                                // Extract and save message_id to context.
                                if (bot.type == "line"){
                                    context.confirmed.message_id = event.message.id;
                                } else if (bot.type == "facebook"){
                                    context.confirmed.message_id = event.message.mid;
                                }

                                // Save asnwer to context.
                                if (!response.result || !response.result.Solution){
                                    context.confirmed.answer = "ちょっと調べてみますね。少々お待ちを。";
                                } else {
                                    context.confirmed.answer = striptags(response.result.Solution);
                                    context.confirmed.answer_id = response.result.ID.attributes.id;
                                    context.confirmed.answer_summary = response.result.Summary;
                                }

                                let tasks = [];

                                if (!response.result || !response.result.Solution){
                                    // ### Task Overview in case we have NO answer ###
                                    // -> Send pending to user.
                                    // -> Send help to administrator.

                                    // -> Send pending to user.
                                    tasks.push(bot.queue([{text: context.confirmed.answer}]));

                                    // -> Send help to administrator.
                                    if ((!!process.env.LINE_ADMIN_USER_ID && bot.type == "line") || (!!process.env.FACEBOOK_ADMIN_USER_ID && bot.type == "facebook")){
                                        tasks.push(this.need_help(bot, "わからないこと聞かれました。", bot.extract_sender_id(), context.confirmed.question));
                                    }
                                } else {
                                    // ### Task Overview in case we have answer ###
                                    // -> Send answer to user.
                                    // -> Collect rating.

                                    // -> Send answer to user.
                                    bot.queue({text: context.confirmed.answer});

                                    // -> Collect rating.
                                    bot.collect("rating");
                                }

                                return Promise.all(tasks).then(
                                    (response) => {
                                        return resolve();
                                    }
                                )
                            }
                        );
                    } else if (process.env.FAQ_MODE == "robot"){ // This is Robot Only Mode.
                        debug("Robot mode reaction.");
                        return rightnow.bot_search_answer(value, process.env.RN_PRODUCT).then(
                            (response) => {
                                // Save interacion id for later rating.
                                context.confirmed.interaction_id = response.interaction_id;

                                // Extract and save message_id to context.
                                if (bot.type == "line"){
                                    context.confirmed.message_id = event.message.id;
                                } else if (bot.type == "facebook"){
                                    context.confirmed.message_id = event.message.mid;
                                }

                                // Save asnwer to context.
                                if (!response.result || !response.result.Solution){
                                    context.confirmed.answer = "ごめんなさい、わかりませんでした。";
                                } else {
                                    context.confirmed.answer = striptags(response.result.Solution);
                                    context.confirmed.answer_id = response.result.ID.attributes.id;
                                    context.confirmed.answer_summary = response.result.Summary;
                                }

                                let tasks = [];

                                // ### Task Overview ###
                                // -> Send answer to user.
                                // -> Collect rating if we have an answer.

                                // -> Send answer to user.
                                bot.queue({text: context.confirmed.answer});

                                // -> Collect rating if we have an answer.
                                if (!!response.result && !!response.result.Solution){
                                    bot.collect("rating");
                                }

                                return Promise.all(tasks).then(
                                    (response) => {
                                        return resolve();
                                    }
                                );
                            }
                        );
                    }
                }
            }
        }

        this.optional_parameter = {
            rating: {
                message_to_confirm: {
                    type: "template",
                    altText: "この回答、役に立ちました？（はい・いいえ）",
                    template: {
                        type: "confirm",
                        text: "この回答、役に立ちました？",
                        actions: [
                            {type: "message", label: "はい", text: "はい"},
                            {type: "message", label: "いいえ", text: "いいえ"}
                        ]
                    }
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (!error){
                        // Promise List.
                        let tasks = [];

                        // ### Tasks Overview ###
                        // -> Rate content in FAQ database.
                        // -> Reply message depending on the rating.
                        // -> Send Help to administrator if user says answer is not useful. (Hybrid Mode Only)

                        // Rate Content in FAQ database.
                        tasks.push(rightnow.bot_rate_answer(context.confirmed.interaction_id, context.confirmed.answer_id, value, 3));

                        // Reply message depending on the rating.
                        if (value == 3){
                            bot.queue({text: "ホッ。"});
                        } else if (value == 1){
                            bot.queue({text: "ガッビーン。"});
                        }

                        // Send Help to administrator if user says answer is not useful.
                        if (value == 1 && process.env.FAQ_MODE == "hybrid"){
                            if ((!!process.env.LINE_ADMIN_USER_ID && bot.type == "line") || (!!process.env.FACEBOOK_ADMIN_USER_ID && bot.type == "facebook")){
                                // Extract user_id.
                                let user_id;
                                if (bot.type == "line"){
                                    user_id = event.source.userId;
                                } else if (bot.type == "facebook"){
                                    user_id = event.sender.id;
                                }
                                tasks.push(this.need_help(bot, "私の回答、微妙とのこと。", user_id, context.confirmed.question, context.confirmed.answer));
                            }
                        }

                        return Promise.all(tasks).then(
                            (response) => {
                                return resolve();
                            }
                        );
                    } else {
                        bot.change_message_to_confirm("rating", {
                            type: "template",
                            altText: "おっとと、まずさっきの情報お役に立ったかおうかがいしてもよいですか？",
                            template: {
                                type: "confirm",
                                text: "おっとと、まずさっきの情報お役に立ったかおうかがいしてもよいですか？",
                                actions: [
                                    {type: "message", label: "役立った", text: "役立った"},
                                    {type: "message", label: "微妙", text: "微妙"}
                                ]
                            }
                        });
                        return resolve();
                    }
                }
            }
        }

        this.clear_context_on_finish = true;
    }

    parse_rating(value, bot, event, context, resolve, reject){
        debug(`Parsing rating.`);
        let parsed_value;

        if (value.match(/役立った/) || value.match(/はい/) || value.match(/[yY][eE][sS]/) || value.match(/うん/) || value.match(/もちろん/)){
            parsed_value = 3;
        } else if (value.match(/微妙/) || value.match(/いいえ/) || value.match(/全然/) || value.match(/ぜんぜん/) || value.match(/[nN][oO]/) || value.match(/あまり/) || value.match(/違/)){
            parsed_value = 1;
        } else {
            return reject();
        }
        debug(`Parsed value is ${parsed_value}.`);
        return resolve(parsed_value);
    }

    finish(bot, event, context, resolve, reject){
        return bot.reply().then(
            (response) => {
                return resolve();
            }
        );
    }

    need_help(bot, status, sender_user_id, question, answer = null){
        let admin_user_id;
        if (bot.type == "line"){
            admin_user_id = process.env.LINE_ADMIN_USER_ID;
        } else if (bot.type == "facebook"){
            admin_user_id = process.env.FACEBOOK_ADMIN_USER_ID;
        }
        debug("Going to send help message to admin.");
        let message_text;
        if (answer == null){
            message_text = `${status}\n「${question}」`;
        } else {
            message_text = `${status}\n「${question}」=>「${answer}」`;
        }
        message_text.replace("&nbsp;", "");
        if (bot.type == "line" && message_text.length > 160){
            message_text = message_text.substr(0, 160);
        }
        if (bot.type == "facebook" && message_text.length > 1000){
            message_text = message_text.substr(0, 1000);
        }
        return bot.send(admin_user_id, [{
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: message_text,
                    buttons: [
                        {type: "postback", title: "回答する", payload: `ユーザーからの質問に回答します。 $$ ${sender_user_id} $$ ${question}`}
                    ]
                }
            }
        }]);
    }
};
