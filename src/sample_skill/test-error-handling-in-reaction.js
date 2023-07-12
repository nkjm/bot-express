"use strict";

module.exports = class SkillTestErrorHandlingInReaction {
    constructor(){
        this.required_parameter = {
            name: {
                message_to_confirm: {
                    type: "text",
                    text: "Name?"
                },
                parser: async (value, bot, event, context) => {
                    if (typeof value == "string"){
                        if (value.length < 5){
                            return value;
                        } else {
                            throw new Error(`Too long.`);
                        }
                    }
                    throw new Error();
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        bot.change_message_to_confirm("name", {
                            type: "text",
                            text: error.message
                        })
                    }
                }
            }
        }
    }

    async finish(bot, event, context, resolve, reject){
    }
}
