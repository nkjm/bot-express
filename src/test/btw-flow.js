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
}/*,{
    name: "facebook",
    options: {
        facebook_app_secret: process.env.FACEBOOK_APP_SECRET
    }
}*/];

chai.use(chaiAsPromised);
const should = chai.should();
const user_id = "dummy_user_id";

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test btw flow from " + emu.messenger_type, async function(){
        beforeEach(async () => {
            await emu.clear_context(user_id);
        })

        describe("Restart conversation", async function(){
            it("will trigger restart_conversation.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ライトの色をかえたい"));

                // Bot is asking what color user like to change to.
                context.should.have.property("confirming").and.deep.equal("color");

                context = await emu.send(emu.create_message_event(user_id, "赤"));

                // Bot has accepted the value and conversation completed.
                context.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});

                // Restart Conversation
                context = await emu.send(emu.create_message_event(user_id, "ライトの色をかえたい"));

                // Bot is asking what color user like to change to.
                context.should.have.property("_flow").and.equal("btw");
                context.should.have.property("confirming").and.deep.equal("color");
            });
        });

        describe("Change intent", async function(){
            it("will trigger change intent.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ライトの色をかえたい"));

                // Bot is asking what color user like to change to.
                context.should.have.property("confirming").and.deep.equal("color");

                context = await emu.send(emu.create_message_event(user_id, "赤"));

                // Bot has accepted the value and conversation completed.
                context.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});

                // Change intent.
                context = await emu.send(emu.create_message_event(user_id, "ピザを注文したい"));

                // Bot is asking what color user like to change to.
                context.should.have.property("_flow").and.equal("btw");
                context.should.have.property("confirming").and.deep.equal("pizza");
                context.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});
            });
        });

        describe("Change parameter", async function(){
            it("will trigger change parameter.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ライトの色をかえたい"));

                // Bot is asking what color user like to change to.
                context.should.have.property("confirming").and.deep.equal("color");

                context = await emu.send(emu.create_message_event(user_id, "赤"));

                // Bot has accepted the value and conversation completed.
                context.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});

                // Change intent.
                context = await emu.send(emu.create_message_event(user_id, "青"));

                // Bot has accepted the value.
                context.should.have.property("_flow").and.equal("btw");
                context.should.have.property("confirmed").and.deep.equal({color: "5068FF"});
            });
        });

        describe("Unidentifiable message", async function(){
            it("will trigger default skill.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ライトの色をかえたい"));

                // Bot is asking what color user like to change to.
                context.should.have.property("confirming").and.deep.equal("color");

                context = await emu.send(emu.create_message_event(user_id, "赤"));

                // Bot has accepted the value and conversation completed.
                context.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});

                context = await emu.send(emu.create_message_event(user_id, "ほげほげ"));

                // Bot replied using default skill while keeping parameter.
                context.should.have.property("_flow").and.equal("btw");
                context.intent.name.should.equal("input.unknown");
                context.confirmed.should.deep.equal({})
            });
        });

        describe("Postback which contains intent object.", async function(){
            it("will trigger change intent.", async function(){
                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "こんにちは");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("simple-response");
                    let event;
                    if (emu.messenger_type === "line"){
                        event = emu.create_postback_event(user_id, {
                            data: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order"
                                }
                            })
                        });
                    } else if (emu.messenger_type === "facebook"){
                        event = emu.create_postback_event(user_id, {
                            payload: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order"
                                }
                            })
                        });
                    }
                    return emu.send(event);
                }).then(function(context){
                    context._flow.should.equal("btw");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.confirming.should.equal("pizza");
                });
            });
        });

        describe("Postback which contains intent object and parameters.", async function(){
            it("will trigger change intent and set parameters.", async function(){
                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "こんにちは");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("simple-response");
                    let event;
                    if (emu.messenger_type === "line"){
                        event = emu.create_postback_event(user_id, {
                            data: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order",
                                    parameters: {
                                        pizza: "マリナーラ"
                                    }
                                }
                            })
                        });
                    } else if (emu.messenger_type === "facebook"){
                        event = emu.create_postback_event(user_id, {
                            payload: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order",
                                    parameters: {
                                        pizza: "マリナーラ"
                                    }
                                }
                            })
                        });
                    }
                    return emu.send(event);
                }).then(function(context){
                    context._flow.should.equal("btw");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.confirming.should.equal("size");
                });
            });
        });

        describe("Postback which contains intent object and parameters and some are not for now.", async function(){
            it("will trigger change intent and set parameters.", async function(){
                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "こんにちは");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("simple-response");
                    let event;
                    if (emu.messenger_type === "line"){
                        event = emu.create_postback_event(user_id, {
                            data: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order",
                                    parameters: {
                                        pizza: "マリナーラ",
                                        address: "東京都港区南青山"
                                    }
                                }
                            })
                        });
                    } else if (emu.messenger_type === "facebook"){
                        event = emu.create_postback_event(user_id, {
                            payload: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order",
                                    parameters: {
                                        pizza: "マリナーラ",
                                        address: "東京都港区南青山"
                                    }
                                }
                            })
                        });
                    }
                    return emu.send(event);
                }).then(function(context){
                    context._flow.should.equal("btw");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.confirming.should.equal("size");
                    context.confirmed.should.deep.equal({
                        pizza: "マリナーラ"
                    })
                    context.heard.should.deep.equal({
                        address: "東京都港区南青山"
                    })
                    return emu.send(emu.create_message_event(user_id, "S"));
                }).then(function(context){
                    context.confirmed.should.deep.equal({
                        pizza: "マリナーラ",
                        size: "S",
                        address: {
                            address: "東京都港区南青山",
                            latitude: null,
                            longitude: null,
                        }
                    })
                    context.confirming.should.equal("name");
                });
            });
        });
    });
}
