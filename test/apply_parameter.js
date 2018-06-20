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

    describe("Test apply_parameter from " + emu.messenger_type, function(){
        let user_id = "apply_parameter";

        describe("Say hoge for param a", function(){
            it("should ask param b as usual.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "test-apply-parameter"
                        },
                        language: "ja"
                    })})
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("a");
                    let event = emu.create_message_event(user_id, "hoge");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("b");
                })
            })
        })

        describe("Say skip_b for param a", function(){
            it("should automatically set hoge to param b.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-apply-parameter"
                            }
                        })
                    })
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("a");
                    let event = emu.create_message_event(user_id, "skip_b");
                    return emu.send(event);
                }).then(function(context){
                    should.not.exist(context.confirming);
                    context.confirmed.b.should.equal("hoge");
                })
            });
        });
    });
}
