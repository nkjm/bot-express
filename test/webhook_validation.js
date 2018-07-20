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

    describe("Test webhook validation from " + emu.messenger_type, function(){
        let user_id = "webhook-validation";

        describe("Validation event pattern 1", function(){
            it("should be ignored.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "dummy");
                    event.replyToken = `00000000000000000000000000000000`
                    return emu.send(event);
                }).then(function(context){
                    should.not.exist(context);
                });
            });
        });

        describe("Validation event pattern 2", function(){
            it("should be ignored.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, {
                        type: "sticker",
                        packageId: "1",
                        stickerId: "1"
                    });
                    event.replyToken = `ffffffffffffffffffffffffffffffff`
                    return emu.send(event);
                }).then(function(context){
                    should.not.exist(context);
                });
            });
        });
    });
}
