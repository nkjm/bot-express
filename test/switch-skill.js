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
const user_id = "dummy_user_id";
const  emu = new Emulator(messenger_option.name, messenger_option.options);

describe("Test switch skill", async function(){

    describe("Execute switch_skill without parameter in finish", async function(){
        it("should switch skill.", async function(){

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                intent: {
                    name: "test-switch-skill"
                },
                language: "ja"
            })})
            let context = await emu.send(event);

            context.intent.name.should.equal("test-switch-skill");
            context.confirming.should.equal("param_a");

            context = await emu.send(emu.create_message_event(user_id, "a"));

            context.confirming.should.equal("param_b");

            context = await emu.send(emu.create_message_event(user_id, "b"));

            context.intent.name.should.equal("handle-pizza-order");
            context.confirming.should.equal("pizza");
        });
    });

    describe("Execute switch_skill with parameter in reaction", async function(){
        it("should skip rest of the required parameters and finish and switches skill.", async function(){

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                intent: {
                    name: "test-switch-skill"
                },
                language: "ja"
            })})
            let context = await emu.send(event);

            context.intent.name.should.equal("test-switch-skill");
            context.confirming.should.equal("param_a");

            context = await emu.send(emu.create_message_event(user_id, "switch now"));

            context.intent.name.should.equal("handle-pizza-order");
            context.confirming.should.equal("size");
        });
    });
});
