"use strict";

module.exports = class SkillTestApplyParameter {
    constructor(){
        this.required_parameter = {
            a: {
                message_to_confirm: {
                    type: "text",
                    text: "a pls"
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (value == "skip_b"){
                        await bot.apply_parameter("b", "hoge");
                        return resolve();
                    }
                    return resolve();
                }
            },
            b: {
                message_to_confirm: {
                    type: "text",
                    text: "b pls"
                }
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        return resolve();
    }
}
