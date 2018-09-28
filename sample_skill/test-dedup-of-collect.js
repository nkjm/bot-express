"use strict";

module.exports = class SkillTestDedupOfCollect {
    constructor(){
        this.required_parameter = {
            dedup: {
                message_to_confirm: {
                    type: "dedup?",
                    text: "true or false"
                },
                reaction: async (error, value, bot, event, context) => {
                    if (value == "true"){
                        bot.collect("a");
                    } else if (value == "false_with_key") {
                        bot.collect("a", {dedup: false});
                    } else {
                        bot.collect(
                            {
                                a: {
                                    message_to_confirm: {
                                        type: "text",
                                        text: "anything"
                                    }
                                }
                            }, {
                                dedup: false
                            }
                        );
                    }
                }
            },
            a: {
                message_to_confirm: {
                    type: "text",
                    text: "anything"
                }
            }
        }
    }

    async finish(bot, event, context){
    }
}
