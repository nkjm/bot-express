"use strict"

module.exports = class SkillTestOnAbend {
    constructor(){
        this.required_parameter = {
            a: {
                message: async (bot, event, context) => {
                    return {
                        type: "text",
                        text: "Pls tell a."
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (value === "bom"){
                        throw Error("bom_in_reaction")
                    }
                }
            }
        }
    }

    async on_abend(error, bot, event, context){
        await bot.reply({
            type: "text",
            text: `${error.message}`
        })
    }

    async begin(bot, event, context){
        if (context.intent.parameters && context.intent.parameters.bom){
            throw Error("bom_in_begin")
        }
    }

    async finish(bot, event, context){
        throw Error("bom_in_finish")
    }
}