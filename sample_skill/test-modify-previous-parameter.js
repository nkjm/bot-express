"use strict";

module.exports = class SkillModifyPreviousParameter {
    constructor(){
        this.required_parameter = {
            a: {
                message_to_confirm: {
                    type: "text",
                    text: "a pls"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "a"){
                        return resolve(value);
                    }
                    return reject();
                }
            },
            b: {
                message_to_confirm: {
                    type: "text",
                    text: "b pls"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "b"){
                        return resolve(value);
                    }
                    return reject();
                }
            }
        }
    }

    finish(bot, event, context, resolve, reject){
        return resolve();
    }
}
