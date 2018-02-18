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

    describe("Test dig flow from " + emu.messenger_type, function(){
        let user_id = "dig";

        describe("Ask supported color when user is asked for what color likes to change to.", function(){
            it("switches intent to answer-available-color and get back.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ライトの色をかえたい");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "color");
                    let event = emu.create_message_event(user_id, "何色にできるの");
                    return emu.send(event);
                }).then(function(context){
                    // Now bot answers supported colors.
                    context.previous.message[0].message.text.should.equal("利用できるライトの色は青、赤、黄でございます。");

                    // Context get back to change-light color.
                    context.intent.name.should.equal("change-light-color");
                    context.should.have.property("confirming", "color");

                    let event = emu.create_message_event(user_id, "青");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[0].message.text.should.equal("了解しましたー。");
                });
            });
        });
    });
}
