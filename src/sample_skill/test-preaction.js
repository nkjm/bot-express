"use strict"

module.exports = class SkillTestPreaction {
    constructor(){
        this.required_parameter = {
            shelter: {
                preaction: async (bot, event, context) => {
                    context.global.shelter_type_list = ["Land Rock", "Living Shell"]
                },
                message: async (bot, event, context) => {
                    return {
                        type: "text",
                        text: "Pls select your shelter.",
                        quickReply: {
                            items: Array.from(context.global.shelter_type_list, shelter_type => {
                                return {
                                    type: "action",
                                    action: {
                                        type: "message",
                                        label: shelter_type,
                                        text: shelter_type
                                    }
                                }
                            })
                        }
                    }
                },
                parser: async (value, bot, event, context) => {
                    return bot.builtin_parser.list.parse(value, {
                        list: context.global.shelter_type_list
                    })
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return

                    if (value === "Land Rock"){
                        await bot.apply_parameter({
                            name: "tent",
                            value: "Dock Dome",
                            parse: true
                        })
                    } else if (value === "Living Shell"){
                        await bot.apply_parameter({
                            name: "tent",
                            value: "Dock Dome",
                            preact: false,
                            parse: true
                        })
                    }
                }
            },
            tent: {
                preaction: async (bot, event, context) => {
                    context.global.tent_type_list = ["Amenity Dome", "Land Bleeze"]
                },
                message: {
                    type: "text",
                    text: "Pls tell your tent."
                },
                parser: async (value, bot, event, context) => {
                    if (Array.isArray(context.global.tent_type_list)){
                        return bot.builtin_parser.list.parse(value, {
                            list: context.global.tent_type_list
                        })
                    }
                    return value
                }
            }
        }
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: `${context.confirmed.shelter} is nice.`
        })
    }
}