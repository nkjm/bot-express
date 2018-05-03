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

    describe("Test nlu of dialogflow from " + emu.messenger_type, function(){
        let user_id = "nlu-dialogflow";

        describe("Detectable intent without parameter", function(){
            it("should trigger corresponding skill.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("handle-pizza-order");
                });
            });
        });

        describe("Detectable intent with parameter", function(){
            it("should set parameter.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "マルゲリータを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("handle-pizza-order");
                    context.intent.parameters.pizza.should.equal("マルゲリータ");
                });
            });
        });

        describe("Detectable intent with text response", function(){
            it("should reply with the text.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "どうも");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[0].message.text.should.equal("これはこれは。");
                });
            });
        });

        describe("Detectable intent with custom payload", function(){
            it("should reply with the payload.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "おめでとうございます");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[0].message.should.deep.equal({
                        type: "sticker",
                        packageId: "2",
                        stickerId: "144"
                    });
                });
            });
        });
    });
}
