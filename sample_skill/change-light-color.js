'use strict';

let Promise = require('bluebird');
let hue = require('../sample_service/hue');
let debug = require("debug")("bot-express:skill");

const COLOR_MAPPINGS = [
    {label: "青",code: "5068FF"},
    {label: "赤",code: "FF7B7B"},
    {label: "黄",code: "FFFA6A"}
];

/*
** Change the color of LED lighting of Hue.
*/
module.exports = class SkillChangeLightColor {

    constructor(bot, event) {
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
                parser: (payload, context, resolve, reject) => {
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
                        return reject();
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
                        return reject();
                    }
                    return resolve(parsed_value);
                },
                reaction: (error, parsed_value, context, resolve, reject) => {
                    if (!error){
                        if (parsed_value == "赤"){
                            bot.queue([{
                                text: "センスいいですね！"
                            }]);
                        }
                    }
                    return resolve();
                },
                sub_skill: ["answer-available-light-color"]
            }
        };
    }

    // IFTTT経由でHueのカラーを変更する
    finish(bot, event, context, resolve, reject){
        return hue.change_color(context.confirmed.color).then(
            (response) => {
                let messages = [{
                    text: "了解しましたー。"
                }];
                return bot.reply(messages);
            }
        ).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
