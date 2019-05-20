"use strict";

const debug = require("debug")("*");

module.exports = class SkillTestConfirmingProperty {
    constructor(){
        this.required_parameter = {
            juminhyo_list: {
                list: {
                    order: "new"
                },
                sub_parameter: {
                    juminhyo_type: {
                        message: async (bot, event, context) => {
                            return {
                                type: `text`,
                                text: `必要な住民票を教えてください。`
                            }
                        },
                        parser: async (value, bot, event, context) => {
                            return bot.builtin_parser.list.parse(value, {
                                list: ["住民票", "住民票除票", "記載事項証明", "abc"]
                            })
                        },
                        reaction: async (error, value, bot, event, context) => {
                            if (value === "abc"){
                                await bot.apply_parameter("quantity", 3);
                            }
                        },
                        sub_skill: ["juminhyo_faq"]
                    },
                    whose: {
                        condition: async (bot, event, context) => {
                            debug("condition in whose");
                            if (context.confirmed.juminhyo_type === "住民票"){
                                return true;
                            }
                            return false;
                        },
                        message: async (bot, event, context) => {
                            debug("message_to_confirm in whose");
                            return {
                                type: "text",
                                text: "記載する必要があるのは世帯全員ですが？あるいは個人のみですか？"
                            }
                        },
                        parser: async (value, bot, event, context) => {
                            debug("parser in whose");
                            if (["世帯全員", "個人"].includes(value)){
                                return value;
                            }
                            throw new Error("invalid_error");
                        },
                        reaction: async (error, value, bot, event, context) => {
                            debug("reaction in whose");
                        },
                        sub_skill: ["juminhyo_faq"]
                    },
                    quantity: {
                        message: async (bot, event, context) => {
                            return {
                                type: "text",
                                text: "何通必要ですか？"
                            }
                        },
                        parser: "number"
                    }
                }
            },
            review_juminhyo_list: {
                message: {
                    type: "text",
                    text: "以上でよろしいですか？"
                },
                parser: {
                    type: "list",
                    policy: {
                        list: ["追加", "削除", "以上"]
                    }
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return;

                    if (value === "追加"){
                        bot.collect("review_juminhyo_list");
                        bot.collect("juminhyo_list");
                    } else if (value === "削除"){
                        bot.collect("review_juminhyo_list");
                        bot.collect("juminhyo_to_remove");
                    }
                }
            }
        }

        this.optional_parameter = {
            juminhyo_to_remove: {
                sub_parameter: {
                    juminhyo_type: {
                        message: {
                            type: "text",
                            text: "どの住民票を削除しますか？",
                        }
                    },
                    whose: {
                        condition: async (bot, event, context) => {
                            if (context.confirmed.juminhyo_type === "住民票"){
                                return true;
                            }
                            return false;
                        },
                        message: {
                            type: "text",
                            text: "どなたの書類ですか？"
                        }
                    }
                }
            }
        }
    }

    async finish(bot, event, context){

    }
}
