"use strict";

module.exports = class SkillTestFinish {
    constructor(){
        this.required_parameter = {
            req_a: {
                message_to_confirm: {
                    type: "text",
                    text: "req_a?"
                }
            }
        }

        this.optional_parameter = {
            unknown: {
                message_to_confirm: {
                    type: "text",
                    text: "unknown?"
                }
            },
            heard: {
                message_to_confirm: {
                    type: "text",
                    text: "heard?"
                }
            },
        }
    }

    async finish(bot, event, context){
        if (context.confirmed.req_a === "unknown"){
            bot.collect("unknown");
        } else if (context.confirmed.req_a === "heard" && !context.confirmed.heard){
            bot.collect("heard");
        }
    }
}