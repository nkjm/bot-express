"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestPushFlow {
    constructor(){
        this.required_parameter = {
            diet_type: {
                message_to_confirm: {
                    type: "text",
                    text: "Diet type pls."
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (["breakfast", "lunch", "dinner"].includes(value)){
                        resolve(value);
                    } else {
                        reject();
                    }
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    bot.change_message_to_confirm("diet", {
                        type: "text",
                        text: `What did you eat for ${value}?`
                    });
                    resolve();
                }
            },
            diet: {
                message_to_confirm: {}
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        return bot.reply({
            type: "text",
            text: `You ate ${context.confirmed.diet} for ${context.confirmed.diet_type}.`
        }).then((response) => {
            return resolve();
        });
    }
}
