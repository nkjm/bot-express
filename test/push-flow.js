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
},{
    name: "facebook",
    options: {
        facebook_app_secret: process.env.FACEBOOK_APP_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test push flow from " + emu.messenger_type, function(){

        let user_id = "bot-express:push";

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
    });
}
