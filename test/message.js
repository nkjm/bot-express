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
const user_id = "dummy_user_id";

describe("Test message", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If sender language has been identified and suitable translation label exists,", async function(){
        it("uses the label.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-message"
                    }
                })
            }));

            context.intent.name.should.equal("test-message");
            context.previous.message[0].message.text.should.equal("こんにちは。");

            await emu.clear_context(user_id);

            context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "en",
                    intent: {
                        name: "test-message"
                    }
                })
            }));

            context.intent.name.should.equal("test-message");
            context.previous.message[0].message.text.should.equal("Hello world.");
        });
    });
});

