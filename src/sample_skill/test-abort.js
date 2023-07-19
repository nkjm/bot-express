"use strict";

module.exports = class SkillTestOnAbort {
    constructor(){
        this.required_parameter = {
            order: {
                message_to_confirm: {
                    type: "text",
                    text: "Can I have your order?"
                }
            }
        }

    }
    
    async on_abort(bot, event, context){
        console.log(`${bot.extract_sender_id()} left in confirming ${context.confirming}!`)
    }

    async finish(bot, event, context){
        
    }
}