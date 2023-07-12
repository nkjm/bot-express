"use strict";

module.exports = class SkillTestProcessParametersPostback {
    constructor(){
        this.required_parameter = {
            a: {
                message_to_confirm: {
                    type: "text",
                    text: "a pls"
                }
            },
            b: {
                message_to_confirm: {
                    type: "text",
                    text: "b pls"
                }
            },
            c: {
                message_to_confirm: {
                    type: "text",
                    text: "c pls"
                }
            }
        }
    }

    async finish(bot, event, context){
    }
}
