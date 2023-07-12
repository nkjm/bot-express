"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillSayWelcome {
    constructor(){
        this.clear_context_on_finish = false
    }

    async finish(bot, event, context){
        await bot.reply({
            type: "text",
            text: "Welcome."
        })
    }
}
