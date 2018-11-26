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
    describe("Test clear context from " + emu.messenger_type, function(){
        let user_id = "clear-context";

        describe("bot-express:push event which indicates bye intent", function(){
            it("should keep context", function(){
                this.timeout(15000);
                let event = {
                    type: "bot-express:push",
                    to: {
                        type: "user",
                        userId: user_id
                    },
                    intent: {
                        name: "bye"
                    }
                }
                return emu.send(event).then(function(context){
                    context.intent.name.should.equal("bye");
                });
            });
        });

        describe("bot-express:push event which indicates clear-context intent", function(){
            it("should clear context", function(){
                this.timeout(15000);
                let event = {
                    type: "bot-express:push",
                    to: {
                        type: "user",
                        userId: user_id
                    },
                    intent: {
                        name: "clear-context"
                    }
                }
                return emu.send(event).then(function(context){
                    context._clear.should.equal(true);
                });
            });
        });
    });
}
