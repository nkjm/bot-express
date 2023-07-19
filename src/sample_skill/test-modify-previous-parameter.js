"use strict";

module.exports = class SkillModifyPreviousParameter {
    constructor(){
        this.required_parameter = {
            a: {
                message_to_confirm: {
                    type: "text",
                    text: "a pls"
                },
                parser: async (value, bot, event, context) => {
                    if (value === "a" || value === "skip"){
                        return value;
                    }
                    throw new Error();
                },
            },
            b: {
                condition: async (bot, event, context) => {
                    if (context.confirmed.a === "skip"){
                        return false;
                    }
                    return true;
                },
                message_to_confirm: {
                    type: "text",
                    text: "b pls"
                },
                parser: async (value, bot, event, context) => {
                    if (value === "b" || value === "modify_prev_param" || value === "modify_prev_param_and_clear"){
                        return value;
                    }
                    throw new Error();
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return

                    if (value === "modify_prev_param"){
                        bot.modify_previous_parameter()
                    } else if (value === "modify_prev_param_and_clear"){
                        bot.modify_previous_parameter({
                            clear_confirmed: true
                        })
                    }
                }
            },
            c: {
                message_to_confirm: {
                    type: "text",
                    text: "b pls"
                },
                parser: async (value, bot, event, context) => {
                    if (value === "c"){
                        return value;
                    }
                    throw new Error();
                }
            }
        }
    }

    async finish(bot, event, context){
    }
}
