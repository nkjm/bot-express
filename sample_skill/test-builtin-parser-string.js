"use strict"; 
const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserString {

    constructor() {
        this.required_parameter = {
            test_case: {
                reaction: async (error, value, bot, event, context) => {
                    bot.collect(context.confirmed.test_case)
                }
            },
        }

        this.optional_parameter = {
            katakana: {
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: {
                    type: "string",
                    policy: {
                        character: "katakana"
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        debug(error.message);
                    }
                }
            },
            hiragana: {
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: {
                    type: "string",
                    policy: {
                        character: "hiragana"
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        debug(error.message);
                    }
                }
            },
            minmax: {
                message: {
                    type: "text",
                    text: "dummy",
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
                message: {
                    type: "text",
                    text: "dummy",
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
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: "string",
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        debug(error.message);
                    }
                }
            },
            exclude: {
                message: {
                    type: "text",
                    text: "dummy",
                },
                parser: {
                    type: "string",
                    policy: {
                        exclude: ["hoge"]
                    }
                }
            },
            sanitize: {
                message: {
                    type: "text",
                    text: "dummy"
                },
                parser: {
                    type: "string",
                    policy: {
                        sanitize: true
                    }
                }
            },
            zenkaku: {
                message: {
                    type: "text",
                    text: "dummy"
                },
                parser: {
                    type: "string",
                    policy: {
                        zenkaku: true
                    }
                }
            },
        }
    }

    async finish(bot, event, context){
    }
};
