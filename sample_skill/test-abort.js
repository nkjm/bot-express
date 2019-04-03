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
    
    async on_abort(context){
        console.log("on_abort!!")
    }

    async finish(bot, event, context){
        
    }
}