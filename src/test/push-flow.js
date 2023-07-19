"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const user_id = "bot-express:push";
const emu = new Emulator(
    "line", 
    { line_channel_secret: process.env.LINE_CHANNEL_SECRET }, 
    user_id
)

chai.use(chaiAsPromised);
const should = chai.should();

describe("Test push flow from " + emu.messenger_type, function(){
    describe("bot-express:push event", function(){
        it("should trigger specified skill.", function(){
            this.timeout(15000);

            return emu.clear_context(user_id).then(function(){
                let event = {
                    type: "bot-express:push",
                    to: {
                        type: "user",
                        userId: user_id
                    },
                    intent: {
                        name: "test-push-flow"
                    },
                    language: "ja"
                }
                return emu.send(event);
            }).then(function(context){
                context._flow.should.equal("push");
                context.confirming.should.equal("diet_type");
                context.previous.message[0].from.should.equal("bot");
                let event = emu.create_message_event(user_id, "dinner");
                return emu.send(event);
            }).then(function(context){
                context._flow.should.equal("reply");
                context.confirmed.diet_type = "dinner";
                context.confirming.should.equal("diet");
            });
        });
    });

    describe("bot-express:push event with parameters", function(){
        it("should trigger specified skill.", function(){
            this.timeout(15000);

            return emu.clear_context(user_id).then(function(){
                let event = {
                    type: "bot-express:push",
                    to: {
                        type: "user",
                        userId: user_id
                    },
                    intent: {
                        name: "test-push-flow",
                        parameters: {
                            diet_type: "lunch"
                        }
                    },
                    language: "ja"
                }
                return emu.send(event);
            }).then(function(context){
                context._flow.should.equal("push");
                context.confirming.should.equal("diet");
                context.previous.message[0].from.should.equal("bot");
                let event = emu.create_message_event(user_id, "yakiniku");
                return emu.send(event);
            }).then(function(context){
                context._flow.should.equal("reply");
                context.confirmed.diet_type = "lunch";
                context.confirmed.diet = "yakiniku";
            });
        });
    });

    describe("bot-express:push event with parameters and some are not for now.", function(){
        it("should trigger specified skill.", function(){
            this.timeout(15000);

            return emu.clear_context(user_id).then(function(){
                let event = {
                    type: "bot-express:push",
                    to: {
                        type: "user",
                        userId: user_id
                    },
                    intent: {
                        name: "test-push-flow",
                        parameters: {
                            diet: "yakiniku"
                        }
                    },
                    language: "ja"
                }
                return emu.send(event);
            }).then(function(context){
                context._flow.should.equal("push");
                context.confirming.should.equal("diet_type");
                context.confirmed.should.deep.equal({});
                context.heard.should.deep.equal({
                    diet: "yakiniku"
                });
                let event = emu.create_message_event(user_id, "lunch");
                return emu.send(event);
            }).then(function(context){
                context._flow.should.equal("reply");
                context.confirmed.should.deep.equal({
                    diet_type: "lunch",
                    diet: "yakiniku"
                })
            });
        });
    });

    describe("bot-express:push event with clear_context being undefined or true.", async function(){
        it("should not keep context.", async function(){
            this.timeout(15000)
            let context

            await emu.clear_context()
            context = await emu.launch("test-push-flow", { 
                diet_type: "lunch"
            })
            context._flow.should.equal("start_conversation")
            context.confirmed.should.deep.equal({
                diet_type: "lunch"
            });
            context.confirming.should.equal("diet")

            // Fire push event with clear_context being false.
            context = await emu.send({
                type: "bot-express:push",
                to: {
                    type: "user",
                    userId: user_id
                },
                intent: {
                    name: "handle-pizza-order",
                },
                language: "ja"
            })
            context._flow.should.equal("push")
            context.confirmed.should.deep.equal({})
            context.confirming.should.equal("pizza")
        })
    })

    describe("bot-express:push event with clear_context being false.", async function(){
        it("should keep context.", async function(){
            this.timeout(15000)
            let context

            await emu.clear_context()
            context = await emu.launch("test-push-flow", { 
                diet_type: "lunch"
            })
            context._flow.should.equal("start_conversation")
            context.confirmed.should.deep.equal({
                diet_type: "lunch"
            });
            context.confirming.should.equal("diet")

            // Fire push event with clear_context being false.
            context = await emu.send({
                type: "bot-express:push",
                to: {
                    type: "user",
                    userId: user_id
                },
                intent: {
                    name: "handle-pizza-order",
                },
                clear_context: false,
                language: "ja"
            })
            context._flow.should.equal("push")
            context.confirmed.should.deep.equal({
                diet_type: "lunch"
            })
            context.confirming.should.equal("pizza")
        })
    })
})
