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
    describe("Exit from " + emu.messenger_type, function(){
        let user_id = "exit";

        describe("Does not call bot.exit()", function(){
            it("should ask book_title and book author.", function(){

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-exit",
                            parameters: {
                                book_id: "test_id"
                            }
                        },
                        language: "ja"
                    })})
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("test-exit");
                    context.confirming.should.equal("book_title");
                    let event = emu.create_message_event(user_id, "test title");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("book_author");
                    let event = emu.create_message_event(user_id, "test author");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[0].message.text.should.equal("finished");
                })
            });
        });

        describe("Reaction call bot.exit()", function(){
            it("should skip remaining process and clear context.confirming.", function(){

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-exit",
                            parameters: {
                                book_id: "test id"
                            }
                        },
                        language: "ja"
                    })})
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("test-exit");
                    context.confirming.should.equal("book_title");
                    let event = emu.create_message_event(user_id, "e");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("test-exit");
                    should.not.exist(context.confirming);
                })
            });
        });

        describe("Begin calls bot.exit()", function(){
            it("should skip remaining process including parsing param. Finally it clears context.confirming.", function(){
                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-exit",
                            parameters: {
                                book_title: "x"
                            }
                        },
                        language: "ja"
                    })})
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("test-exit");
                    should.not.exist(context.confirming);
                })
            })
        });

    });
}
