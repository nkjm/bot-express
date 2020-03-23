"use strict";

module.exports = class SkillTestApply {
    constructor(){
        this.required_parameter = {
            fruit_list: {
                list: true,
                apply: async (bot, event, context) => {
                    if (context.heard.fruit_list_to_apply){
                        return context.heard.fruit_list_to_apply
                    }
                },
                message: {
                    type: "text",
                    text: "What fruit do you like?"
                },
            },
        }
    }

    async finish(bot, event, context){
    }
}