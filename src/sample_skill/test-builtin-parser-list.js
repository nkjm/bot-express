"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserList {

    constructor() {
        this.required_parameter = {
            abc: {
                message_to_confirm: {
                    type: "text",
                    text: "abc",
                },
                parser: {
                    type: "list",
                    policy: {
                        list: ["a", "b", "c"]
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
                parser: "list",
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
