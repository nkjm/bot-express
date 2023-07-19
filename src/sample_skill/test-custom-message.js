"use strict"

module.exports = class SkillTestCustomMessage {
    constructor(){
        this.message = "test-message"
        this.required_parameter = {
            hoge: {
                message: async (bot, event, context) => {
                    return bot.m.hello_world()
                }
            }
        }
    }

    async finish(bot, event, context){

    }
}