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

    describe("Test message_to_confirm from " + emu.messenger_type, function(){
        let user_id = "message-to-confirm";

        describe("Message made of object", function(){
            it("will be used as it is.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-message-to-confirm",
                                parameters: {
                                    param_to_test: "made_of_object"
                                }
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "made_of_object");
                    context.previous.message[0].message.text.should.equal("hello");
                });
            });
        });

        describe("Message made of function - resolve", function(){
            it("will generate message dynamically.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-message-to-confirm",
                                parameters: {
                                    param_to_test: "made_of_function"
                                }
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "made_of_function");
                    context.previous.message[0].message.text.should.equal("testing made_of_function");
                });
            });
        });

        describe("Message made of function - reject", function(){
            it("will stop processing.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-message-to-confirm",
                                parameters: {
                                    param_to_test: "made_of_function_reject"
                                }
                            }
                        })
                    });
                    return emu.send(event);
                }).catch(function(error){
                    error.message.should.equal("rejected");
                });
            });
        });

        describe("Message made of function - exception", function(){
            it("will stop processing.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-message-to-confirm",
                                parameters: {
                                    param_to_test: "made_of_function_exception"
                                }
                            }
                        })
                    });
                    return emu.send(event);
                }).catch(function(error){
                    error.message.should.equal("excepted");
                });
            });
        });

        describe("Array of messages made of object", function(){
            it("will send multiple message", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-message-to-confirm",
                                parameters: {
                                    param_to_test: "multiple_messages_made_of_object"
                                }
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "multiple_messages_made_of_object");
                    context.previous.message[0].message.text.should.equal("message2");
                    context.previous.message[1].message.text.should.equal("message1");
                });
            })
        })

        describe("Array of messages made of function", function(){
            it("will send multiple message", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-message-to-confirm",
                                parameters: {
                                    param_to_test: "multiple_messages_made_of_function"
                                }
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "multiple_messages_made_of_function");
                    context.previous.message[0].message.text.should.equal("testing multiple_messages_made_of_function message2");
                    context.previous.message[1].message.text.should.equal("testing multiple_messages_made_of_function message1");
                });
            })
        })
    });
}
