"use strict";

module.exports = class SkillTest_Collect {
    constructor(){
        this.required_parameter = {
            juminhyo_type: {
                message_to_confirm: {
                    type: "text",
                    text: "必要な住民票の種類を教えてください。"
                },
                reaction: async (error, value, bot, event, context) => {
                    if (["戸籍謄本", "戸籍抄本"].includes(value)){
                        bot.collect({
                            "honseki": {
                                condition: async (bot, event, context) => {
                                    if (context.confirmed.juminhyo_type === "戸籍謄本"){
                                        return false;
                                    }
                                    return true;
                                },
                                message_to_confirm: {
                                    type: "text",
                                    text: "本籍地を教えてください。"
                                }
                            }
                        })
                    }
                }
            },
            whose: {
                condition: async (bot, event, context) => {
                    if (["住民票", "住民票除票"].includes(context.confirmed.juminhyo_type)){
                        return true;
                    }
                },
                message_to_confirm: {
                    type: "text",
                    text: "記載する必要があるのは世帯全員ですか？あるいは個人のみですか？"
                },
                reaction: async (error, value, bot, event, context) => {
                    bot.collect("quantity");
                }
            }
        }

        this.optional_parameter = {
            quantity: {
                condition: async (bot, event, context) => {
                    if (context.confirmed.juminhyo_type === "住民票"){
                        return true;
                    }
                },
                message_to_confirm: {
                    type: "text",
                    text: "何通必要ですか？"
                }
            }
        }
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: "完了"
        })
    }
}