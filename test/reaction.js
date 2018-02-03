"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_options = [{
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test reaction from " + emu.messenger_type, function(){
        let user_id = "reaction";

        describe("5 for satisfaction", function(){
            it("will trigger bot.queue().", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "survey"
                            },
                            language: "ja"
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking satisfaction.
                    context.should.have.property("confirming", "satisfaction");
                    let event = emu.create_message_event(user_id, "5");
                    return emu.send(event);
                }).then(function(context){
                    // Bot added a comment and now asking difficulty.
                    context.should.have.property("confirming", "difficulty");
                    context.previous.message.should.have.lengthOf(5);
                    context.previous.message[1].from.should.equal("bot");
                    context.previous.message[1].message.text.should.equal("うぉー！！よかった！");
                    context.previous.message[0].from.should.equal("bot");
                    context.previous.message[0].message.altText.should.equal("難易度はどうでした？");
                });
            });
        });

        describe("1 for satisfaction", function(){
            it("will trigger bot.queue() and bot.collect()", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "survey"
                            },
                            language: "ja"
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking satisfaction.
                    context.should.have.property("confirming", "satisfaction");
                    let event = emu.create_message_event(user_id, "1");
                    return emu.send(event);
                }).then(function(context){
                    // Bot added a comment and now asking optional question of suggestion.
                    context.should.have.property("confirming", "suggestion");
                    context.previous.message.should.have.lengthOf(5);
                    context.previous.message[1].from.should.equal("bot");
                    context.previous.message[1].message.text.should.equal("なんてこった。。");
                    context.previous.message[0].from.should.equal("bot");
                    context.previous.message[0].message.text.should.equal("この勉強会はどのようにすれば改善できると思いますか？");
                    let event = emu.create_message_event(user_id, "音楽があればBetterです。");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "適当");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "がんばってください");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "nkjm.kzk@gmail.com");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking one more optional question of come_back.
                    context.should.have.property("confirming", "come_back");
                    context.previous.message[0].from.should.equal("bot");
                    context.previous.message[0].message.altText.should.equal("いただいた意見を踏まえて改善していこうと思います。なので、また来てくれるかな？");
                    let event = emu.create_message_event(user_id, "いいとも");
                    return emu.send(event);
                }).then(function(context){
                    // Bot replied final message.
                    context.should.have.property("confirming", null);
                    context.previous.message[0].from.should.equal("bot");
                    context.previous.message[0].message.text.should.equal(`完璧です！ありがとうございました！！`);
                })
            });
        });
    });
}
