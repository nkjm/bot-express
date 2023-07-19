"use strict";

module.exports = class SkillTestWhile {
    constructor(){
        this.required_parameter = {
            fruit_list: {
                list: true,
                message: {
                    type: "text",
                    text: "What fruit do you like?"
                },
                while: async (bot, event, context) => {
                    if (context.heard.skip_fruit_list){
                        return false
                    }
                    return (!Array.isArray(context.confirmed.fruit_list) || context.confirmed.fruit_list.length < 3) ? true : false
                }
            },
            member_list: {
                list: true,
                preaction: async (bot, event, context) => {
                    context.global.done_preaction = true
                },
                sub_parameter: {
                    fullname: {
                        message: {
                            type: "text",
                            text: "Tell your fullname.",
                        }
                    },
                    phone: {
                        message: {
                            type: "text",
                            text: "Tell your phone."
                        }
                    },
                    child_list: {
                        list: true,
                        sub_parameter: {
                            child_name: {
                                message: {
                                    type: "text",
                                    text: "Tell your child's name.",
                                }
                            },
                            child_age: {
                                message: {
                                    type: "text",
                                    text: "Tell your child's age.",
                                }
                            },
                        },
                        while: async (bot, event, context) => {
                            return (!Array.isArray(context.confirmed.child_list) || context.confirmed.child_list.length < 2) ? true : false
                        }
                    }
                },
                while: async (bot, event, context) => {
                    if (context.heard.skip_member_list){
                        return false
                    }
                    return (!Array.isArray(context.confirmed.member_list) || context.confirmed.member_list.length < 2) ? true : false
                }
            },
            
        }
    }

    async finish(bot, event, context){
    }
}