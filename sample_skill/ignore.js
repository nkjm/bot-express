"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillIgnore {
    finish(bot, event, context, resolve, reject){
        debug("We ignore this event using ignore skill.");
        return resolve();
    }
}
