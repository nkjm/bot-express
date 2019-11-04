"use strict"; 
const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestUncollect {

    constructor() {
        this.required_parameter = {
            test_case: {
                reaction: async (error, value, bot, event, context) => {
                    if (value === "string"){
                        bot.uncollect("param_b")
                    } else if (value === "array"){
                        bot.uncollect(["param_a", "param_b"])
                    }
                }
            },
            param_a: {
                message: {
                    type: "text",
                    text: "A pls."
                }
            },
            param_b: {
                message: {
                    type: "text",
                    text: "B pls."
                },
                reaction: async (error, value, bot, event, context) => {
                    if (value === "uncollect_collected"){
                        bot.uncollect("param_a")
                    }
                }
            },
            param_c: {
                message: {
                    type: "text",
                    text: "C pls."
                }
            }
        }
    }

    async finish(bot, event, context){

    }
}