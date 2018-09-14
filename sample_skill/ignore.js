"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillIgnore {
    async finish(bot, event, context){
        debug("We ignore this event using ignore skill.");
    }
}
