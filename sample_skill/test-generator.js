"use strict"

module.exports = class SkillTestGenerator {
    constructor(){
    }

    async begin(bot, event, context){
        bot.collect_by_generator("phone", {
            file: "parameter",
            method: "phone",
            options: {
                message_text: "電話番号をお願いします。"
            }
        })
        bot.collect_by_generator("zip_code", {
            file: "parameter",
            method: "zip_code",
            options: {
                message_text: "郵便番号をお願いします。"
            }
        })
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: `${context.confirmed.zip_code} is nice place.`
        })
    }
}