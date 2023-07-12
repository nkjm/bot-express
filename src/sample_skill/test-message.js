"use strict";

module.exports = class TestMessage {
    async finish(bot, event, context){
        const message = await bot.m.hello_world();
        await bot.reply(message);
    }
}