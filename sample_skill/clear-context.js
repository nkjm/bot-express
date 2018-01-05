"use strict";

module.exports = class SkillClearContext {
    constructor(){
        this.clear_context_on_finish = true;
    }

    finish(bot, event, context, resolve, reject){
        return resolve();
    }
}
