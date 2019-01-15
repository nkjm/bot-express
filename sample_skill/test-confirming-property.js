"use strict";

module.exports = class SkillTestConfirmingProperty {
    constructor(){
        this.required_parameter = {
            juminhyo_list: {
                list: {
                    order: "new"
                },
                property: {
                    juminhyo_type: {
                        message_to_confirm: async (bot, event, context) => {
                            return {
                                type: `text`,
                                text: `必要な住民票を教えてください。`
                            }
                        },
                        parser: async (value, bot, event, context) => {
                            return value;
                        },
                        reaction: async (error, value, bot, event, context) => {

                        }
                    },
                    whose: {
                        condition: async (bot, event, context) => {
                            if (context.confirmed.juminhyo_type === "住民票"){
                                return true;
                            }
                            return false;
                        },
                        message_to_confirm: async (bot, event, context) => {
                            return {
                                type: "text",
                                text: "記載する必要があるのは世帯全員ですが？あるいは個人のみですか？"
                            }
                        }
                    },
                    quantity: {
                        message_to_confirm: async (bot, event, context) => {
                            return {
                                type: "text",
                                text: "何通必要ですか？"
                            }
                        }
                    }
                }
            },
            review_juminhyo_list: {
                message_to_confirm: {
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
                message_to_confrim: {
                    type: "text",
                    text: "どの住民票を削除しますか？",
                }
            }
        }
    }

    async finish(bot, event, context){

    }
}
