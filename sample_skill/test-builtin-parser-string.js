"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserString {

    constructor() {
        this.required_parameter = {
            katakana: {
                message_to_confirm: {
                    type: "text",
                    text: "katakana",
                },
                parser: {
                    type: "string",
                    policy: {
                        charactor: "katakana"
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        debug(error.message);
                    }
                }
            },
            hiragana: {
                message_to_confirm: {
                    type: "text",
                    text: "hiragana"
                },
                parser: {
                    type: "string",
                    policy: {
                        charactor: "hiragana"
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        debug(error.message);
                    }
                }
            },
            minmax: {
                message_to_confirm: {
                    type: "text",
                    text: "minmax"
                },
                parser: {
                    type: "string",
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
            regex: {
                message_to_confirm: {
                    type: "text",
                    text: "regex"
                },
                parser: {
                    type: "string",
                    policy: {
                        regex: "^[a-c]{3}$"
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
                    text: "no_policy"
                },
                parser: "string",
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        debug(error.message);
                    }
                }
            },
            exclude: {
                message_to_confirm: {
                    type: "text",
                    text: "exclude"
                },
                parser: {
                    type: "string",
                    policy: {
                        exclude: ["cancel"]
                    }
                }
            }
        }
    }

    async finish(bot, event, context){
    }
};
