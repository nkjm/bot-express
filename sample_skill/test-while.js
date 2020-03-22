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
                    return (context.confirmed.fruit_list.length < 3) ? true : false
                }
            },
            member_list: {
                list: true,
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
                            return (context.confirmed.child_list.length < 2) ? true : false
                        }
                    }
                },
                while: async (bot, event, context) => {
                    return (context.confirmed.member_list.length < 2) ? true : false
                }
            },
            
        }
    }

    async finish(bot, event, context){
    }
}