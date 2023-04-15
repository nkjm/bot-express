"use strict";

module.exports = class SkillTestRewindAction {
    constructor(){
        this.required_parameter = {
            revert: {
                message: {
                    type: "text",
                    text: "Revert?"
                },
                parser: {
                    type: "list",
                    policy: {
                        list: ["revert", "delete", "no"]
                    }
                }
            }, 
            payment_amount: {
                apply: async (bot, event, context) => {
                    return 0
                },
            },
            num_of_seat: {
                message: {
                    type: "text",
                    text: "Please input num of seat"
                },
                parser: {
                    type: "number",
                    policy: {
                        min: 1,
                        max: 2,
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return

                    if (["revert", "delete"].includes(context.confirmed.revert)){
                        context.rewind.push({
                            type: "apply",
                            rewinding_parameter: "num_of_seat",
                            parameter_name: "payment_amount",
                            parameter_value: (context.confirmed.revert == "revert") ? context.confirmed.payment_amount : undefined
                        })
                    }
                    context.confirmed.payment_amount = context.confirmed.payment_amount + (200 * value)
                }
            },
            review: {
                message: {
                    type: "text",
                    text: "Good to go?"
                },
                parser: async (value, bot, event, context) => {
                    if (value === "OK"){
                        return value;
                    }
                    throw new Error();
                }
            }
        }
    }

    async finish(bot, event, context){
    }
}
