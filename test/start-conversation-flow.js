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

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test start conversation flow from " + emu.messenger_type, function(){
        let user_id = "start-conversation-flow";

        describe("Unsupported event", function(){
            it("should be skipped", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_unsupported_event(user_id);
                    return emu.send(event);
                }).then(function(context){
                    should.not.exist(context);
                });
            });
        });

        describe("Identifiable message", function(){
            it("should trigger start conversation flow and pick up suitable skill.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("_flow").and.equal("start_conversation");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.to_confirm.should.have.lengthOf(4);
                    context.confirming.should.equal("pizza");
                    context.confirmed.should.deep.equal({});
                });
            });
        });

        describe("Identifiable message including parameters.", function(){
            it("should trigger start conversation flow and set parameters.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "マルゲリータのLサイズをお願いしたいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("_flow").and.equal("start_conversation");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.to_confirm.should.have.lengthOf(2);
                    context.confirming.should.equal("address");
                    context.confirmed.should.deep.equal({
                        pizza: "マルゲリータ",
                        size: "L"
                    });
                });
            });
        });

        describe("Unidentifiable message", function(){
            it("should trigger start conversation flow and set default intent.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ほげほげ");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("_flow").and.equal("start_conversation");
                    context.intent.name.should.equal("input.unknown");
                });
            });
        });

        describe("Postback which contains intent object.", function(){
            it("should trigger start conversation flow and set specified intent.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
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
                    context.should.have.property("_flow").and.equal("start_conversation");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.confirming.should.equal("pizza");
                });
            });
        });

        describe("Postback which contains intent object with parameters.", function(){
            it("should trigger start conversation flow and set specified intent and parameters.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
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
                    context.should.have.property("_flow").and.equal("start_conversation");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.confirming.should.equal("size");
                });
            });
        });

        describe("Postback which contains intent object with parameters and one parameters is not for now.", function(){
            it("should trigger start conversation flow and set specified intent and parameters.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event;
                    if (emu.messenger_type === "line"){
                        event = emu.create_postback_event(user_id, {
                            data: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order",
                                    parameters: {
                                        pizza: "マリナーラ",
                                        address: "東京都港区南青山",
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
                                        address: "東京都港区南青山",
                                    }
                                }
                            })
                        });
                    }
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("_flow").and.equal("start_conversation");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.confirmed.should.deep.equal({
                        pizza: "マリナーラ"
                    })
                    context.heard.should.deep.equal({
                        address: "東京都港区南青山"
                    })
                    context.confirming.should.equal("size");

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

        describe("Postback which contains intent object with parameters and multi parameters are not for now.", function(){
            it("should trigger start conversation flow and set specified intent and parameters.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event;
                    if (emu.messenger_type === "line"){
                        event = emu.create_postback_event(user_id, {
                            data: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order",
                                    parameters: {
                                        pizza: "マリナーラ",
                                        address: "東京都港区南青山",
                                        name: "中嶋一樹"
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
                                        address: "東京都港区南青山",
                                        name: "中嶋一樹"
                                    }
                                }
                            })
                        });
                    }
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("_flow").and.equal("start_conversation");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.confirmed.should.deep.equal({
                        pizza: "マリナーラ"
                    })
                    context.heard.should.deep.equal({
                        address: "東京都港区南青山",
                        name: "中嶋一樹"
                    })
                    context.confirming.should.equal("size");

                    return emu.send(emu.create_message_event(user_id, "S"));
                }).then(function(context){
                    context._clear.should.equal(true);
                });
            });
        });

        describe("Postback which contains intent object with parameters and parser reject first one.", function(){
            it("should set params as heard and they're applied afterwards.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event;
                    if (emu.messenger_type === "line"){
                        event = emu.create_postback_event(user_id, {
                            data: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "handle-pizza-order",
                                    parameters: {
                                        pizza: "しらすピザ",
                                        size: "S"
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
                                        pizza: "しらすピザ",
                                        size: "S"
                                    }
                                }
                            })
                        });
                    }
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("_flow").and.equal("start_conversation");
                    context.intent.name.should.equal("handle-pizza-order");
                    context.heard.should.deep.equal({
                        size: "S"
                    })
                    context.confirming.should.equal("pizza");

                    return emu.send(emu.create_message_event(user_id, "マリナーラ"));
                }).then(function(context){
                    context.confirmed.pizza.should.equal("マリナーラ");
                    context.confirmed.size.should.equal("S");
                    context.confirming.should.equal("address");
                });
            });
        });
    });
}
