"use strict";

const debug = require("debug")("bot-express:skill");
const hue = require('../sample_service/hue');
Promise = require('bluebird');

const COLOR_MAPPINGS = [
    {label: "青",code: "5068FF"},
    {label: "赤",code: "FF7B7B"},
    {label: "黄",code: "FFFA6A"}
];

/*
** Change the color of LED lighting of Hue.
*/
module.exports = class SkillChangeLightColor {

    constructor() {
        this.required_parameter = {
            color: {
                message_to_confirm: {
                    type: "template",
                    altText: "何色にしますか？（青か赤か黄）",
                    template: {
                        type: "buttons",
                        text: "何色にしますか？",
                        actions: [
                            {type:"postback",label:"青",data:"青"},
                            {type:"postback",label:"赤",data:"赤"},
                            {type:"postback",label:"黄",data:"黄"}
                        ]
                    }
                },
                parser: async (payload, bot, event, context) => {
                    let requested_color;
                    if (bot.type == "line"){
                        if (typeof payload == "string"){
                            requested_color = payload;
                        } else if (typeof payload == "object"){
                            requested_color = payload.data;
                        }
                    } else if (bot.type == "facebook"){
                        if (typeof payload == "string"){
                            requested_color = payload;
                        } else if (typeof payload == "object"){
                            requested_color = payload.payload;
                        }
                    }
                    if (requested_color == null || requested_color == ""){
                        throw new Error();
                    }
                    let found_color = false;
                    let parsed_value;
                    for (let color_mapping of COLOR_MAPPINGS){
                        if (requested_color.replace("色", "") == color_mapping.label){
                            parsed_value = color_mapping.code;
                            found_color = true;
                        }
                    }
                    if (!found_color){
                        throw new Error();
                    }
                    return parsed_value;
                },
                reaction: async (error, parsed_value, bot, event, context) => {
                    if (!error){
                        if (parsed_value == "赤"){
                            bot.queue([{
                                text: "センスいいですね！"
                            }]);
                        }
                    }
                },
                sub_skill: ["answer-available-light-color"]
            }
        }

        this.clear_context_on_finish = false
    }

    // IFTTT経由でHueのカラーを変更する
    async finish(bot, event, context){
        await hue.change_color(context.confirmed.color);

        let message = {
            text: "了解しましたー。"
        };
        await bot.reply(message);
    }
};
