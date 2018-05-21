"use strict";

module.exports = class SkillTestExit {
    constructor(){
        this.required_parameter = {
            book_title: {
                message_to_confirm: {
                    type: "text",
                    text: "book title pls"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "x"){
                        throw new Error("x");
                    }
                    return resolve(value);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (value === "e"){
                        bot.exit();
                    }
                    return resolve();
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

    begin(bot, event, context, resolve, reject){
        if (!context.intent.parameters.book_id){
            return bot.reply({
                type: "text",
                text: `exit in begin`
            }).then(() => {
                bot.exit();
                return resolve();
            })
        }
        return resolve();
    }

    finish(bot, event, context, resolve, reject){
        return bot.reply({
            type: "text",
            text: `finished`
        }).then(() => {
            return resolve();
        })
    }
}
