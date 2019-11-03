
"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserDatetime {

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
                    type: "datetime",
                    policy: {
                        min: "2019-11-05 09:01",
                        max: "2019-11-10T10:15"
                    }
                },
            },
        }
    }

    async finish(bot, event, context){

    }
}