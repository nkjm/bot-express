"use strict"; 
const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserPhone {

    constructor() {
        this.required_parameter = {
            test_case: {
                reaction: async (error, value, bot, event, context) => {
                    bot.collect(context.confirmed.test_case)
                }
            },
        }

        this.optional_parameter = {
            no_policy: {
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: {
                    type: "phone",
                },
            },
            length: {
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: {
                    type: "phone",
                    policy: {
                        length: 10
                    }
                },
            },
            max: {
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: {
                    type: "phone",
                    policy: {
                        max: 10
                    }
                },
            },
            min: {
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: {
                    type: "phone",
                    policy: {
                        min: 10
                    }
                },
            },

        }
    }

    finish(bot, event, context){

    }
}