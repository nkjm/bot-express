"use strict";

module.exports = class SkillSwitchSkill {
    constructor(){
        this.required_parameter = {
            param_a: {
                message_to_confirm: {
                    type: "text",
                    text: "param a?"
                },
                reaction: async (error, value, bot, event, context) => {
                    if (value === "switch now"){
                        bot.switch_skill({
                            name: "handle-pizza-order",
                            parameters: {
                                pizza: "マルゲリータ"
                            }
                        })
                    }
                }
            },
            param_b: {
                message_to_confirm: {
                    type: "text",
                    text: "param b?"
                }
            }
        }
        this.clear_context_on_finish = true;
    }

    async finish(bot, event, context){
        bot.switch_skill({
            name: "handle-pizza-order"
        })
    }
}