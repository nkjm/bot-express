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

    describe("Test modify_previous_parameter from " + emu.messenger_type, function(){
        let user_id = "modify-previous-parameter";

        describe("Say 訂正", function(){
            it("should ask previously confirmed parameter.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-modify-previous-parameter"
                        },
                        language: "ja"
                    })})
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("a");
                    let event = emu.create_message_event(user_id, "a");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("b");
                    let event = emu.create_message_event(user_id, "訂正");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("a");
                })
            })
        })
    });

    describe("Test modify_previous_parameter from " + emu.messenger_type, function(){
        let user_id = "modify-previous-parameter";

        describe("Trigger modify_previous_parameter by intent postback", function(){
            it("should ask previously confirmed parameter.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-modify-previous-parameter"
                        },
                        language: "ja"
                    })})
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("a");
                    let event = emu.create_message_event(user_id, "a");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("b");
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "modify-previous-parameter"
                        }
                    })});
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("a");
                })
            })
        })
    });
}
