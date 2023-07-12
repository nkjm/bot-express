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

    describe("Test beacon flow from " + emu.messenger_type, function(){
        let user_id = "beacon-flow";

        describe("beacon enter event", function(){
            it("should trigger survey skill.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = {
                        "replyToken": "dummy",
                        "type": "beacon",
                        "timestamp": Date.now(),
                        "source": {
                            "type": "user",
                            "userId": user_id
                        },
                        "beacon": {
                            "hwid": "d41d8cd98f",
                            "type": "enter"
                        }
                    }
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({});
                    context.should.have.property("confirming", "satisfaction");
                    context.should.have.property("to_confirm").have.lengthOf(4);
                    context.to_confirm[0].should.equal("satisfaction");
                    context.to_confirm[1].should.equal("difficulty");
                    context.to_confirm[2].should.equal("free_comment");
                    context.to_confirm[3].should.equal("mail");
                    context.previous.confirmed.should.deep.equal([]);
                });
            });
        });

        describe("beacon leave event", function(){
            it("should trigger bye skill.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = {
                        "replyToken": "dummy",
                        "type": "beacon",
                        "timestamp": Date.now(),
                        "source": {
                            "type": "user",
                            "userId": user_id
                        },
                        "beacon": {
                            "hwid": "d41d8cd98f",
                            "type": "leave"
                        }
                    }
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({});
                    context.should.have.property("confirming", null);
                    context.should.have.property("to_confirm").and.deep.equal([]);
                    context.previous.confirmed.should.deep.equal([]);
                });
            });
        });
    });
}
