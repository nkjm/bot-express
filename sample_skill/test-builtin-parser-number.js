"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserNumber {

    constructor() {
        this.required_parameter = {
            minmax: {
                message_to_confirm: {
                    type: "text",
                    text: "minmax",
                },
                parser: {
                    type: "number",
                    policy: {
                        min: 3,
                        max: 5
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        debug(error.message);
                    }
                }
            },
            no_policy: {
                message_to_confirm: {
                    type: "text",
                    text: "no_policy",
                },
                parser: "number",
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        debug(error.message);
                    }
                }
            }
        }
    }

    async finish(bot, event, context){
    }
};
