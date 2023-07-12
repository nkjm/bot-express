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
                reaction: async (error, value, bot, event, context) => {
                    bot.collect(value);
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
                message_to_confirm: async (bot, event, context) => {
                    return {
                        type: "text",
                        text: `testing ${context.confirmed.param_to_test}`
                    }
                }
            },
            made_of_function_reject: { // Contains message made of function and calls reject().
                message_to_confirm: async (bot, event, context) => {
                    throw new Error("rejected");
                }
            },
            made_of_function_exception: { // Contains message made of function and calls reject().
                message_to_confirm: async (bot, event, context) => {
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
                message_to_confirm: async (bot, event, context) => {
                    return [{
                        type: "text",
                        text: `testing ${context.confirmed.param_to_test} message1`
                    },{
                        type: "text",
                        text: `testing ${context.confirmed.param_to_test} message2`
                    }]
                }
            }
        }
    }

    async finish(bot, event, context){
        let message = {
            type: "text",
            text: `finished`
        }
        await bot.reply(message);
    }
};
