'use strict';

let debug = require("debug")("bot-express:skill");

module.exports = class SkillTestDatetimepicker {

    constructor(bot, event) {
        this.required_parameter = {
            date: {
                message_to_confirm: {
                    type: "template",
                    altText: "日にちを教えてください",
                    template: {
                        type: "buttons",
                        text: "日にちを教えてください",
                        actions: [
                            {type: "datetimepicker", label: "日にちを選択", mode: "date", data: ""}
                        ]
                    }
                }
            }
        }
    }

    parse_date(postback, context, resolve, reject){
        if (postback.params && postback.params.date){
            return resolve(postback.params.date);
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
