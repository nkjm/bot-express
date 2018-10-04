"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserDialogflow {

    // コンストラクター。このスキルで必要とする、または指定することができるパラメータを設定します。
    constructor() {
        this.required_parameter = {
            pizza: {
                message_to_confirm: {
                    type: "template",
                    altText: "ご注文のピザはお決まりでしょうか？ マルゲリータ、マリナーラからお選びください。",
                    template: {
                        type: "buttons",
                        text: "ご注文のピザはお決まりでしょうか？",
                        actions: [
                            {type:"message",label:"マルゲリータ",text:"マルゲリータ"},
                            {type:"message",label:"マリナーラ",text:"マリナーラ"}
                        ]
                    }
                },
                parser: "dialogflow",
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        if (value == "") return;
                        bot.change_message_to_confirm("pizza", {
                            type: "text",
                            text: "恐れ入りますが当店ではマルゲリータかマリナーラしかございません。どちらになさいますか？"
                        });
                    } else {
                        bot.queue({
                            type: "text",
                            text: `${value}ですね。ありがとうございます。`
                        });
                    }
                }
            },
            size: {
                message_to_confirm: {
                    type: "template",
                    altText: "サイズはいかがいたしましょうか？ S、M、Lからお選びください。",
                    template: {
                        type: "buttons",
                        text: "サイズはいかがいたしましょうか？",
                        actions: [
                            {type:"message",label:"S",text:"S"},
                            {type:"message",label:"M",text:"M"},
                            {type:"message",label:"L",text:"L"}
                        ]
                    }
                },
                parser: "dialogflow"
            },
            review: {
                message_to_confirm: (bot, event, context) => {
                    let message = {
                        type: "template",
                        altText: `最後にご注文内容の確認です。${context.confirmed.pizza}の${context.confirmed.size}サイズでよろしかったでしょうか？`,
                        template: {
                            type: "confirm",
                            text: `最後にご注文内容の確認です。${context.confirmed.pizza}の${context.confirmed.size}サイズでよろしかったでしょうか？`,
                            actions: [
                                {type: "message", label: "はい", text: "はい"},
                                {type: "message", label: "いいえ", text: "いいえ"}
                            ]
                        }
                    }
                    return message;
                },
                parser: {
                    type: "dialogflow", 
                    policy: {
                        parameter_name: "yes_no"
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return;

                    if (value === "いいえ"){
                        bot.collect("size");
                        bot.collect("pizza");
                    }
                }
            }
        }

        this.clear_context_on_finish = true;
    }

    async finish(bot, event, context){
    }
};
