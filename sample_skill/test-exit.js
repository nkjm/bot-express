"use strict";

module.exports = class SkillTestExit {
    constructor(){
        this.required_parameter = {
            book_title: {
                message_to_confirm: {
                    type: "text",
                    text: "book title pls"
                },
                parser: async (value, bot, event, context) => {
                    if (value === "x"){
                        throw new Error("x");
                    }
                    return value;
                },
                reaction: async (error, value, bot, event, context) => {
                    if (value === "e"){
                        bot.exit();
                    }
                }
            },
            book_author: {
                message_to_confirm: {
                    type: "text",
                    text: "book author pls"
                }
            }
        }
    }

    async begin(bot, event, context){
        if (!context.intent.parameters.book_id){
            await bot.reply({
                type: "text",
                text: `exit in begin`
            });
            bot.exit();
        }
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: `finished`
        });
    }
}
