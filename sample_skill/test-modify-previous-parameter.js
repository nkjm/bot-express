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
                }
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
                    if (value === "b"){
                        return value;
                    }
                    throw new Error();
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
