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
                parser: async (value, bot, event, context) => {
                    if (["breakfast", "lunch", "dinner"].includes(value)){
                        return value;
                    }
                    throw new Error();
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return;

                    bot.change_message_to_confirm("diet", {
                        type: "text",
                        text: `What did you eat for ${value}?`
                    });
                }
            },
            diet: {
                message_to_confirm: {}
            }
        }
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: `You ate ${context.confirmed.diet} for ${context.confirmed.diet_type}.`
        })
    }
}
