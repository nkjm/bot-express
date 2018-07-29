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
        let user_id = "error-handling-in-reaction";

        describe("Valid name", function(){
            it("will be accepted.", function(){
                this.timeout(3000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-error-handling-in-reaction"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "name");
                    let event = emu.create_message_event(user_id, "Tom");
                    return emu.send(event);
                }).then(function(context){
                    should.not.exist(context.confirming);
                });
            });
        });

        describe("Too long name", function(){
            it("will be rejected and reason will be replied.", function(){
                this.timeout(3000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-error-handling-in-reaction"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "name");
                    let event = emu.create_message_event(user_id, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "name");
                    context.previous.message[0].message.text.should.equal(`Too long.`);
                });
            });
        });
    });
}
