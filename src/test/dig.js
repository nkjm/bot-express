"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_option = {
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
};

chai.use(chaiAsPromised);
const should = chai.should();

const emu = new Emulator(messenger_option.name, messenger_option.options);

describe("Test dig", async function(){
    const user_id = "dig";

    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("Ask supported color when user is asked for what color likes to change to.", async function(){
        it("switches intent to answer-available-color and get back.", async function(){
            let context;

            context = await emu.send(emu.create_message_event(user_id, "ライトの色をかえたい"));

            context.should.have.property("confirming", "color");
            context._parent.should.have.lengthOf(0);
            context._sub_skill.should.equal(false);

            context = await emu.send(emu.create_message_event(user_id, "何色にできるの"));

            // Switched to sub skill.
            context.intent.name.should.equal("answer-available-light-color");
            context.should.have.property("confirming", "param_a");
            context._parent.should.have.lengthOf(1);
            context._sub_skill.should.equal(true);

            context = await emu.send(emu.create_message_event(user_id, "a"));

            // Context get back to change-light color.
            context.intent.name.should.equal("change-light-color");
            context.should.have.property("confirming", "color");
            context.previous.message[0].message.text.should.equal("利用できるライトの色は青、赤、黄でございます。");
            context._parent.should.have.lengthOf(0);
            context._sub_skill.should.equal(false);

            context = await emu.send(emu.create_message_event(user_id, "青"));

            context.previous.message[0].message.text.should.equal("了解しましたー。");
        });
    });
});
