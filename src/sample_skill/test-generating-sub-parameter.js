"use strict"

module.exports = class SkillTestGeneratingSubParameter {
    constructor(){
    }

    async begin(bot, event, context){
        bot.collect_by_generator("contact_list", {
            file: "parameter",
            method: "contact_list",
            options: null
        })
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: `phone: ${context.confirmed.contact_list[0].phone}, zip_code: ${context.confirmed.contact_list[0].zip_code}`
        })
    }
}