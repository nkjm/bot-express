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
},{
    name: "facebook",
    options: {
        facebook_app_secret: process.env.FACEBOOK_APP_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);
    let user_id = "change-message-to-confirm";
    describe("Test change_message_to_confirm() from " + emu.messenger_type, function(){
        describe("Invalid value for satisfaction", function(){
            it("will trigger change_message_to_confirm()", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = {
                        type:"bot-express:push",
                        to: {
                            type: "user",
                            userId: user_id
                        },
                        intent: {
                            name: "survey"
                        }
                    }
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("survey");
                    context.confirming.should.equal("satisfaction");
                    let event = emu.create_message_event(user_id, "6");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("satisfaction");
                    context.previous.message[0].from.should.equal("bot");
                    context.previous.message[0].message.text.should.equal("ん？1が最低、5が最高の5段階評価ですよ。数字で1から5のどれかで教えてくださいね。");
                    let event = emu.create_message_event(user_id, "3");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("difficulty");
                })
            });
        });
    });
}
