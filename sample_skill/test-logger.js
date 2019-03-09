"use strict";

module.exports = class SkillTestLogger {
    constructor(){
        this.required_parameter = {
            param_a: {
                message_to_confirm: async (bot, event, context) => {
                    throw new Error("Wow!")
                }
            }
        }
    }

    async finish(bot, event, context){

    }
}