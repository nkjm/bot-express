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

    describe("Test handle-pizza-order skill from " + emu.messenger_type, function(){
        let user_id = "builtin-parser";

        describe("Invalid answer for pizza", function(){
            it("will be rejected by parser and bot asks same question once again.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-builtin-parser"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "pizza");
                    let event = emu.create_message_event(user_id, "ジェノベーゼで");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "pizza");
                });
            });
        });

        describe("Valid answer for pizza", function(){
            it("will be accepted and bot set pizza マルゲリータ and asks pizza size.", function(){
                this.timeout(15000);

                let event = emu.create_message_event(user_id, "じゃ、マルゲリータ");
                return emu.send(event).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({pizza:"マルゲリータ"});
                    context.should.have.property("confirming", "size");
                });
            });
        });

        describe("Provide object for parser", function(){
            it("will be accepted and bot set pizza マルゲリータ and asks pizza size.", function(){
                this.timeout(15000);

                let event = emu.create_message_event(user_id, "S");
                return emu.send(event).then(function(context){
                    context.should.have.property("confirming", "address");
                    let event = emu.create_message_event(user_id, "東京都港区南青山1-1-1");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "name");
                    let event = emu.create_message_event(user_id, "中嶋一樹");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "review");
                    let event = emu.create_message_event(user_id, "へ？");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "review");
                    let event = emu.create_message_event(user_id, "いいえ");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "pizza");
                });
            });
        })
    });
}
