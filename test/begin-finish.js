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

    describe("Test begin() and finish() from " + emu.messenger_type, function(){

        let user_id = "begin-finish";

        describe("In start conversation flow", function(){
            it("should run through begin, required param and finish.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-begin-finish"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot saying welcome message followed by asking name.
                    context.previous.message[1].message.text.should.equal("ようこそ私を召喚くださいました。");
                    context.previous.message[0].message.text.should.equal("お名前を教えてください。");
                    let event = emu.create_message_event(user_id, "中嶋一樹");
                    return emu.send(event);
                }).then(function(context){
                    // Bot saying welcome message followed by asking name.
                    context.previous.message[0].message.text.should.equal("中嶋一樹さん、さようなら。");
                });
            });
        });

        describe("When intent is changed in the middle of the conversation", function(){
            it("should run through begin, required param and finish.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "handle-pizza-order"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot saying welcome message followed by asking name.
                    context.intent.name.should.equal("handle-pizza-order");
                    let event = emu.create_message_event(user_id, "test-begin-finish");
                    return emu.send(event);
                }).then(function(context){
                    // Bot saying welcome message followed by asking name.
                    context.previous.message[1].message.text.should.equal("ようこそ私を召喚くださいました。");
                    context.previous.message[0].message.text.should.equal("お名前を教えてください。");
                    let event = emu.create_message_event(user_id, "中嶋一樹");
                    return emu.send(event);
                }).then(function(context){
                    // Bot saying welcome message followed by asking name.
                    context.previous.message[0].message.text.should.equal("中嶋一樹さん、さようなら。");
                });
            });
        });

        describe("When intent is changed in the middle of the conversation", function(){
            it("should run through begin, required param and finish.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "bye"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot saying welcome message followed by asking name.
                    context.intent.name.should.equal("bye");
                    let event = emu.create_message_event(user_id, "test-begin-finish");
                    return emu.send(event);
                }).then(function(context){
                    context._flow.should.equal("btw");
                    context.previous.message[1].message.text.should.equal("ようこそ私を召喚くださいました。");
                    context.previous.message[0].message.text.should.equal("お名前を教えてください。");
                    let event = emu.create_message_event(user_id, "中嶋一樹");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[0].message.text.should.equal("中嶋一樹さん、さようなら。");
                });
            });
        });
    });
}
