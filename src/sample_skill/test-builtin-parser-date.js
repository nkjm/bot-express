
"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserDate {

    constructor() {
        this.required_parameter = {
            test_case: {
                reaction: async (error, value, bot, event, context) => {
                    bot.collect(context.confirmed.test_case)
                }
            },
        }

        this.optional_parameter = {
            minmax: {
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: {
                    type: "date",
                    policy: {
                        min: "2019-11-05",
                        max: "2019-11-10"
                    }
                },
            },
        }
    }

    async finish(bot, event, context){

    }
}