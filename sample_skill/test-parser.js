"use strict";

const debug = require('debug')('bot-express:skill');

module.exports = class SkillTestParser {

    constructor(){
        this.required_parameter = {
            function_based: {
                message_to_confirm: {
                    type: "text",
                    text: "type?"
                },
                parser: async (value, bot, event, context) => {
                    if (["世帯全員分", "本人だけ"].includes(value)){
                        return value;
                    }
                    throw new Error("「世帯全員分」または「本人だけ」とお答えください。");
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        bot.change_message_to_confirm("function_based", {
                            type: "text",
                            text: error.message
                        });
                    }
                }
            },
            no_parser: {
                message_to_confirm: {
                    type: "text",
                    text: "name?"
                }
            }
        }
    }

    async finish(bot, event, context){
    }
};
