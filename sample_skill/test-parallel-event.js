"use strict";

const debug = require("debug")("bot-express:skill");
const Promise = require("bluebird");

class SkillTestParallelEvent {
    async finish(bot, event, context, resolve, reject){
        Promise.resolve().delay(3000).then((response) => {
            return bot.reply({
                type: "text",
                text: "done"
            }).then((response) => {
                return resolve();
            })
        })
    }
}

module.exports = SkillTestParallelEvent;
