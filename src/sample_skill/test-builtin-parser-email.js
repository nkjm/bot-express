"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserEmail {

    constructor() {
        this.required_parameter = {
            email: {
                message_to_confirm: {
                    type: "text",
                    text: "email",
                },
                parser: "email",
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
