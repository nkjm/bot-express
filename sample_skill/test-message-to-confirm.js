"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestMessageToConfirm {

    constructor() {
        this.required_parameter = {
            param_to_test: {
                message_to_confirm: {
                    type: "text",
                    text: "param to test"
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    bot.collect(value);
                    return resolve();
                }
            }
        }

        this.optional_parameter = {
            made_of_object: { // Contains message made of object.
                message_to_confirm: {
                    type: "text",
                    text: "hello"
                }
            },
            made_of_function: { // Contains message made of function.
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    return resolve({
                        type: "text",
                        text: `testing ${context.confirmed.param_to_test}`
                    })
                }
            },
            made_of_function_reject: { // Contains message made of function and calls reject().
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    return reject(new Error("rejected"));
                }
            },
            made_of_function_exception: { // Contains message made of function and calls reject().
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    throw new Error("excepted");
                }
            },
            multiple_messages_made_of_object: {
                message_to_confirm: [{
                    type: "text",
                    text: "message1"
                },{
                    type: "text",
                    text: "message2"
                }]
            },
            multiple_messages_made_of_function: {
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    return resolve([{
                        type: "text",
                        text: `testing ${context.confirmed.param_to_test} message1`
                    },{
                        type: "text",
                        text: `testing ${context.confirmed.param_to_test} message2`
                    }])
                }
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        let message = {
            type: "text",
            text: `finished`
        }
        return bot.reply(message).then((response) => {
            return resolve(response);
        });
    }
};
