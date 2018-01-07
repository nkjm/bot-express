"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestMessageToConfirm {

    constructor() {
        this.required_parameter = {
            pizza: { // Contains message made of object.
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
                }
            },
            size: { // Contains message made of function.
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    return resolve({
                        type: "template",
                        altText: `${context.confirmed.pizza}ですね。サイズはいかがしましょうか？ S、M、Lからお選びください。`,
                        template: {
                            type: "buttons",
                            text: `${context.confirmed.pizza}ですね。サイズはいかがしましょうか？`,
                            actions: [
                                {type:"message",label:"S",text:"S"},
                                {type:"message",label:"M",text:"M"},
                                {type:"message",label:"L",text:"L"}
                            ]
                        }
                    });
                }
            },
            name: { // Contains message made of function and calls reject().
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    if (context.confirmed.size === "S"){
                        return reject(new Error("Could not generate message for some reason."));
                    } else {
                        throw new Error("Error occured for some reason.");
                    }
                }
            }
        }

        this.clear_context_on_finish = true;
    }

    finish(bot, event, context, resolve, reject){
        let messages = {
            text: `ご注文ありがとうございました！${context.confirmed.pizza}の${context.confirmed.size}サイズを30分以内にお届けに上がります。`
        }
        return bot.reply(messages).then((response) => {
            return resolve(response);
        });
    }
};
