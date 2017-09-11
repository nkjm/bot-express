'use strict';

let debug = require("debug")("bot-express:skill");

module.exports = class SkillTestDatetimepicker {

    constructor(bot, event) {
        this.bot = bot;
        this.event = event;

        this.required_parameter = {
            test_case: {
                message_to_confirm: {
                    type: "template",
                    altText: "テストケースを選択してください。",
                    template: {
                        type: "buttons",
                        text: "テストケースを選択してください。",
                        actions: [
                            {type: "message", label: "buttons_date_only", text: "buttons_date_only"},
                            {type: "message", label: "buttons_date_and_url", text: "buttons_date_and_url"},
                            {type: "message", label: "carousel_date_only", text: "carousel_date_only"},
                            {type: "message", label: "carousel_date_and_url", text: "carousel_date_and_url"}
                        ]
                    }
                },
                reaction: (error, value, context, resolve, reject) => {
                    if (!error){
                        bot.collect(value);
                    }
                    return resolve();
                }
            }
        }

        this.optional_parameter = {
            buttons_date_only: {
                message_to_confirm: {
                    type: "template",
                    altText: "日にちを教えてください",
                    template: {
                        type: "buttons",
                        text: "日にちを教えてください",
                        actions: [
                            {type: "datetimepicker", label: "日にちを選択", mode: "date", data: "dummy"}
                        ]
                    }
                },
                parser: (a, b, c, d) => {
                    return this.postback_parser(a, b, c, d);
                }
            },
            buttons_date_and_url: {
                message_to_confirm: {
                    type: "template",
                    altText: "日にちを教えてください",
                    template: {
                        type: "buttons",
                        text: "日にちを教えてください",
                        actions: [
                            {type: "uri", label: "詳細を見る", uri: "https://www.linecorp.com"},
                            {type: "datetimepicker", label: "日にちを選択", mode: "date", data: "dummy"}
                        ]
                    }
                },
                parser: (a, b, c, d) => {
                    return this.postback_parser(a, b, c, d);
                }
            },
            carousel_date_only: {
                message_to_confirm: {
                    type: "template",
                    altText: "日にちを教えてください",
                    template: {
                        type: "carousel",
                        columns: [{
                            text: "日にちを選択してください",
                            actions: [
                                {type: "datetimepicker", label: "日にちを選択", mode: "date", data: "dummy"}
                            ]
                        }]
                    }
                },
                parser: (a, b, c, d) => {
                    return this.postback_parser(a, b, c, d);
                }
            },
            carousel_date_and_url: {
                message_to_confirm: {
                    type: "template",
                    altText: "日にちを教えてください",
                    template: {
                        type: "carousel",
                        columns: [{
                            text: "日にちを選択してください",
                            actions: [
                                {type: "uri", label: "詳細を見る", uri: "https://www.linecorp.com"},
                                {type: "datetimepicker", label: "日にちを選択", mode: "date", data: "dummy"}
                            ]
                        }]
                    }
                },
                parser: (a, b, c, d) => {
                    return this.postback_parser(a, b, c, d);
                }
            }
        }
    }

    postback_parser(postback, context, resolve, reject){
        if (typeof postback == "string"){
            return resolve(postback);
        }
        if (this.bot.type == "line"){
            return resolve(postback.params.date);
        } else if (this.bot.type == "facebook"){
            return resolve(postback.payload);
        }
        return reject();
    }

    finish(bot, event, context, resolve, reject){
        return bot.reply({
            type: "text",
            text: "完了"
        }).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
