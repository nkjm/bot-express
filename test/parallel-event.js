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
const Promise = require("bluebird");

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test parallel event from " + emu.messenger_type, function(){
        let user_id = "parallel-event";

        describe("1 events", function(){
            it("should be processed.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-parallel-event"
                        },
                        language: "ja"
                    })});
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("test-parallel-event");
                    context.previous.message[0].message.text.should.equal("done");
                });
            });
        });

        describe("2 parallel events", function(){
            it("should ignore second event.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-parallel-event"
                        },
                        language: "ja"
                    })});
                    return Promise.all([
                        emu.send(event),
                        Promise.resolve().delay(1000).then(() => {
                            return emu.send(event)
                        })
                    ]);
                }).then(function(context_list){
                    let num_of_ignored = 0;

                    for (let context of context_list){
                        if (!context){
                            num_of_ignored++;
                        }
                    }
                    num_of_ignored.should.equal(1);
                });
            });
        });

        describe("2 parallel events and 1 is bot-express:push", function(){
            it("should ignore second event.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-parallel-event"
                        },
                        language: "ja"
                    })});
                    return Promise.all([
                        emu.send(event),
                        Promise.resolve().delay(1000).then(() => {
                            let event = {
                                type: "bot-express:push",
                                to: {
                                    type: "user",
                                    userId: user_id
                                },
                                intent: {
                                    name: "test-parallel-event"
                                },
                                language: "ja"
                            }
                            return emu.send(event)
                        })
                    ]);
                }).then(function(context_list){
                    let num_of_ignored = 0;

                    for (let context of context_list){
                        if (!context){
                            num_of_ignored++;
                        }
                    }
                    num_of_ignored.should.equal(0);
                });
            });
        });

        describe("3 parallel events", function(){
            it("should ignored second event but process third event.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-parallel-event"
                        },
                        language: "ja"
                    })});
                    return Promise.all([
                        emu.send(event),
                        Promise.resolve().delay(1000).then(() => {
                            return emu.send(event)
                        }),
                        Promise.resolve().delay(2000).then(() => {
                            return emu.send(event)
                        }),
                    ]);
                }).then(function(context_list){
                    let num_of_ignored = 0;
                    for (let context of context_list){
                        if (!context){
                            num_of_ignored++;
                        }
                    }
                    num_of_ignored.should.equal(1);
                });
            });
        });
    });
}
