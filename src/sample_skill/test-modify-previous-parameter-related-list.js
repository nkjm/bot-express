"use strict";

module.exports = class SkillModifyPreviousParameter {
    constructor(){
        this.required_parameter = {
            a: {
                message_to_confirm: {
                    type: "text",
                    text: "a pls"
                },
            },
            b: {
                list: {
                    order: "old"
                },
                sub_parameter: {
                    b1: {
                        message_to_confirm: {
                            type: "text",
                            text: "b1 pls"
                        },
                    },
                    b2: {
                        message_to_confirm: {
                            type: "text",
                            text: "b2 pls"
                        },    
                    }
                }
            }
        }
    }

    async finish(bot, event, context){
    }
}
