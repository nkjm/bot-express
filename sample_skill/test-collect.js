"use strict";

module.exports = class SkillTestCollect {
    constructor(){
        this.required_parameter = {
            req_a: {
                message_to_confirm: {
                    type: "text",
                    text: "req_a?"
                },
                reaction: async (error, value, bot, event, context) => {
                    if (value === "opt_a_key"){
                        bot.collect("opt_a");
                    } else if (value === "opt_a_obj") {
                        bot.collect({
                            opt_a: {
                                message_to_confirm: {
                                    type: "text",
                                    text: "opt_a_obj?"
                                }
                            }
                        })
                    } else if (value === "req_b"){
                        bot.collect({
                            req_b: {
                                message_to_confirm: {
                                    text: "text",
                                    text: "req_b_obj?"
                                }
                            }
                        })
                    } else if (value === "dynamic"){
                        bot.collect({
                            dynamic: {
                                message_to_confirm: {
                                    type: "text",
                                    text: "dynamic?"
                                }
                            }
                        })
                    }
                }
            },
            req_b: {
                message_to_confirm: {
                    type: "text",
                    text: "req_b?"
                }
            }
        }

        this.optional_parameter = {
            opt_a: {
                message_to_confirm: {
                    type: "text",
                    text: "opt_a?"
                }
            }
        }
    }

    async finish(bot, event, context){

    }
}