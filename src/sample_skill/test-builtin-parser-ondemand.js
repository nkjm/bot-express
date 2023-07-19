"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestBuiltinParserOndemand {
    constructor() {
        this.required_parameter = {
            pizza: {
                message_to_confirm: {
                    type: "text",
                    text: "ご注文のピザはお決まりでしょうか？ マルゲリータ、マリナーラからお選びください。",
                },
                parser: async (value, bot, event, context) => {
                    return await bot.builtin_parser.dialogflow.parse(value, {
                        parameter_name: "pizza",
                    })
                }
            },
            size: {
                message_to_confirm: {
                    type: "template",
                    text: "サイズはいかがいたしましょうか？ S、M、Lからお選びください。",
                },
                parser: async (value, bot, event, context) => {
                    return await bot.builtin_parser.list.parse(value, {
                        list: ["S", "M", "L"]
                    })
                }
            }
        }

        this.clear_context_on_finish = true;
    }

    async finish(bot, event, context){
    }
};
