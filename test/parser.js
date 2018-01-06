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

    describe("Test parser from " + emu.messenger_type, function(){
        let user_id = "parser";

        describe("NLP return some params but no corresponding parameter found in skill", function(){
            it("will skip that parameter.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "juminhyo",
                                parameters: {
                                    dummy: "dummy"
                                }
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "type");
                    context.confirmed.should.deep.equal({});
                });
            });
        });

        describe("There is corresponding parameter and parser. If parser succeeds,", function(){
            it("will apply the value.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "juminhyo"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "type");
                    context.confirmed.should.deep.equal({});
                    let event = emu.create_message_event(user_id, "世帯全員分");
                    return emu.send(event);
                }).then(function(context){
                    context.confirmed.should.have.property("type", "世帯全員分");
                });
            });
        });

        describe("There is corresponding parameter and parser. If parser fails,", function(){
            it("does not apply the value and ask samke question once again.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "juminhyo"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "type");
                    context.confirmed.should.deep.equal({});
                    let event = emu.create_message_event(user_id, "他人の分");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "type");
                    context.confirmed.should.deep.equal({});
                });
            });
        });

        describe("There is corresponding parameter but no parser found", function(){
            it("will apply the value as it is unless the value is empty.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "juminhyo"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "本人だけ");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "中嶋一樹です");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "いいえ");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "中嶋");
                    return emu.send(event);
                }).then(function(context){
                    context.confirmed.should.have.property("lastname", "中嶋");
                });
            });
        });
    });
}
