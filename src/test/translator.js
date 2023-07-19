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

    describe("Test translator from " + emu.messenger_type, function(){
        let user_id = "translator";

        describe("Japanese", function(){
            it("will be detected as Japanese.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが")
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("handle-pizza-order");
                    context.sender_language.should.equal("ja");
                });
            });
        });

        /*
        describe("Order pizza in Thai", function(){
            it("will trigger handle-pizza-order", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ฉันต้องการสั่งพิซซ่า")
                    return emu.send(event);
                }).then(function(context){
                    context.sender_language.should.equal("th");
                    context.intent.name.should.equal("handle-pizza-order");
                });
            });
        });

        describe("Order pizza in Thai - in reply flow", function(){
            it("will trigger handle-pizza-order", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ฉันต้องการสั่งพิซซ่า")
                    return emu.send(event);
                }).then(function(context){
                    context.sender_language.should.equal("th");
                    context.intent.name.should.equal("handle-pizza-order");
                    let event = emu.create_message_event(user_id, "ฉันต้องการสั่งพิซซ่า")
                    return emu.send(event);
                }).then(function(context){
                    context._flow.should.equal("reply");
                    context.sender_language.should.equal("th");
                    context.intent.name.should.equal("handle-pizza-order");
                });
            });
        });

        describe("Order pizza in Thai - in btw flow", function(){
            it("will trigger handle-pizza-order", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "simple-response"
                        },
                        language: "th"
                    })})
                    return emu.send(event);
                }).then(function(context){
                    context.sender_language.should.equal("th");
                    let event = emu.create_message_event(user_id, "ฉันต้องการสั่งพิซซ่า")
                    return emu.send(event);
                }).then(function(context){
                    context._flow.should.equal("btw");
                    context.sender_language.should.equal("th");
                    context.intent.name.should.equal("handle-pizza-order");
                });
            });
        });
        */
    });
}
