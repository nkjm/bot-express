'use strict';

let Promise = require('bluebird');
let debug = require("debug")("bot-express:skill");

module.exports = class SkillAnswerAvailableLightColor {

    finish(bot, event, context, resolve, reject){
        return bot.reply({
            type: "text",
            text: "利用できるライトの色は青、赤、黄でございます。"
        }).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
