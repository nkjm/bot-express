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
const emu = new Emulator(messenger_option.name, messenger_option.options, user_id);

describe("Test modify_previous_parameter in related list" + emu.messenger_type, async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If send modify_previous at first child question in related list", async function(){
        it("collect the question which confirmed before related list", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                intent: {
                    name: "test-modify-previous-parameter-related-list"
                },
                language: "ja"
            })}));

            context.confirming.should.equal("a");
            context = await emu.send(emu.create_message_event(user_id, "a"));

            context.confirming.should.equal("b1");
            context._sub_parameter.should.equal(true)

            context = await emu.modify_previous()

            context.confirming.should.equal("a")
            context.previous.confirmed.should.have.lengthOf(0)
            context.previous.processed.should.have.lengthOf(0)
        })
     })
})

