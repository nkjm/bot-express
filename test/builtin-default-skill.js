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

    describe("Test default skill from " + emu.messenger_type, function(){
        let user_id = "default-skill";

        describe("Unidentifiable message", function(){
            it("should trigger start conversation flow and pick up default skill.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ほげほげ");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("input.unknown");
                    context.previous.message[0].message.type.should.equal("sticker");
                });
            });
        });
    });
}
