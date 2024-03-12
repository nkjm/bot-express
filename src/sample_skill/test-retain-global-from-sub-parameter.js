"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillTestRetainGlobalInSubParameter {
    constructor(){
        this.required_parameter = {
            agreement: {
                preaction: async (bot, event, context) => {
                    context.global.confirming.agreement = {
                        ping: "agreement pong"
                    }
                },
                apply: async (bot, event, context) => {
                    return true
                }
            },
            family_list: {
                list: {
                    order: "old"
                },
                sub_parameter: {
                    fullname: {
                        preaction: async (bot, event, context) => {
                            context.global.confirming.fullname = {
                                ping: "fullname pong"
                            }
                        },
                        message: {
                            type: "text",
                            text: "Your fullname pls."
                        }
                    },
                }
            },
            review: {
                message: {
                    type: "text",
                    text: "Review pls."
                }
            }
        }
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: "Thank you for your review."
        })
    }
}
