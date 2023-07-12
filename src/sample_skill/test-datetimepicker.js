'use strict';

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestDatetimepicker {

    constructor() {
        this.required_parameter = {
            test_case: {
                message_to_confirm: {
                    type: "template",
                    altText: "テストケースを選択してください。",
                    template: {
                        type: "buttons",
                        text: "テストケースを選択してください。",
                        actions: [
                            {type: "message", label: "btn_date_only", text: "buttons_date_only"},
                            {type: "message", label: "btn_date_and_url", text: "buttons_date_and_url"},
                            {type: "message", label: "crsl_date_only", text: "carousel_date_only"},
                            {type: "message", label: "crsl_date_and_url", text: "carousel_date_and_url"}
                        ]
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (!error){
                        bot.collect(value);
                    }
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
                parser: this.postback_parser
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
                parser: this.postback_parser
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
                parser: this.postback_parser
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
                parser: this.postback_parser
            }
        }
    }

    async postback_parser(postback, bot, event, context){
        if (typeof postback == "string"){
            return postback
        }
        if (bot.type == "line"){
            return postback.params.date;
        } else if (bot.type == "facebook"){
            return postback.payload;
        }
        throw new Error();
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: "完了"
        });
    }
};
