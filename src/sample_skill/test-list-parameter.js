"use strict";

const debug = require('debug')('bot-express:skill');

module.exports = class SkillTestListParameter {

    constructor(){
        this.required_parameter = {
            default_param: {
                message_to_confirm: {
                    type: "text",
                    text: "default param?"
                }
            },
            list_param_default: {
                list: true,
                message_to_confirm: {
                    type: "text",
                    text: "list param default?"
                },
                reaction: async (err, value, bot, event, context) => {
                    if (context.confirmed.list_param_default.length === 1){
                        bot.collect("list_param_default");
                    }
                }
            },
            list_param_newest_first: {
                list: {
                    order: "new"
                },
                message_to_confirm: {
                    type: "text",
                    text: "list param newest first?"
                },
                reaction: async (err, value, bot, event, context) => {
                    if (context.confirmed.list_param_newest_first.length === 1){
                        bot.collect("list_param_newest_first");
                    }
                }
            },
            list_param_oldest_first: {
                list: {
                    order: "old"
                },
                message_to_confirm: {
                    type: "text",
                    text: "list param oldest fisrst?"
                },
                reaction: async (err, value, bot, event, context) => {
                    if (context.confirmed.list_param_oldest_first.length === 1){
                        bot.collect("list_param_oldest_first");
                    }
                }
            }
        }
    }

    async finish(bot, event, context){
    }
};
