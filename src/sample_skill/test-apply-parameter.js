"use strict";

module.exports = class SkillTestApplyParameter {
    constructor(){
        this.required_parameter = {
            a: {
                message_to_confirm: {
                    type: "text",
                    text: "a pls"
                },
                reaction: async (error, value, bot, event, context) => {
                    if (value == "skip_b"){
                        await bot.apply_parameter({
                            name: "b", 
                            value: "hoge"
                        })
                    }
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

    async finish(bot, event, context){
    }
}
