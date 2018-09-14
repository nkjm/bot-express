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
                    if (value === "a"){
                        return value;
                    }
                    throw new Error();
                }
            },
            b: {
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
            }
        }
    }

    async finish(bot, event, context){
    }
}
