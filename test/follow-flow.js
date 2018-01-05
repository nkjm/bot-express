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

    describe("Test follow flow from " + emu.messenger_type, function(){

        let user_id = "follow-flow";

        describe("follow event", function(){
            it("should trigger follow skill.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = {
                        "replyToken": "dummy",
                        "type": "follow",
                        "timestamp": Date.now(),
                        "source": {
                            "type": "user",
                            "userId": user_id
                        }
                    }
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message.should.have.lengthOf(2);
                    context.previous.message[0].from.should.equal("bot");
                    context.previous.message[0].message.should.deep.equal({
                        type: "text",
                        text: "Welcome."
                    });
                });
            });
        });
    });
}
