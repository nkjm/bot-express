"use strict";

module.exports = class SkillTestErrorHandlingInReaction {
    constructor(){
        this.required_parameter = {
            name: {
                message_to_confirm: {
                    type: "text",
                    text: "Name?"
                },
                parser: async (value, bot, event, context, resolve, reject) => {
                    if (typeof value == "string"){
                        if (value.length < 5){
                            return resolve();
                        } else {
                            return reject(`Too long.`)
                        }
                    }
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error){
                        console.log(error);
                        bot.change_message_to_confirm("name", {
                            type: "text",
                            text: error.message
                        })
                    }
                    return resolve();
                }
            }
        }
    }

    async finish(bot, event, context, resolve, reject){
        return resolve();
    }
}
