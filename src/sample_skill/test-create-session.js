"use strict"

module.exports = class SkillTestCreateSession {
    constructor(){
        this.required_parameter = {
            shelter: {
                preaction: async (bot, event, context) => {
                    context.global.session_key = await bot.create_session()
                },
                message: {
                    type: "text",
                    text: "Pls tell me your shelter."
                },
            }
        }
    }

    async finish(bot, event, context){
        return bot.reply({
            type: "text",
            text: `${context.confirmed.shelter} is nice one.`
        })
    }
}