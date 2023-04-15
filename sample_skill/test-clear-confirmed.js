"use strict";

module.exports = class SkillTestClearConfirmed {
    constructor(){
        this.required_parameter = {
            collect_payment_amount: {
                message: {
                    type: "text",
                    text: "Collect payment amount?"
                },
                parser: {
                    type: "list",
                    policy: {
                        list: ["yes", "no"]
                    }
                }
            }, 
            payment_amount_a: {
                condition: async (bot, event, context) => {
                    return context.confirmed.collect_payment_amount == "yes"
                },
                apply: async (bot, event, context) => {
                    return 100
                },
            },
            payment_amount_b: {
                condition: async (bot, event, context) => {
                    return context.confirmed.collect_payment_amount == "yes"
                },
                apply: async (bot, event, context) => {
                    return 100
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
