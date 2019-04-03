"use strict";

require("dotenv").config();

const Promise = require("bluebird");
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

describe("Test _collect", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If user stopped in the middle of conversation", async function(){
        it("runs on_abort function.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-abort"
                    }
                })
            }));

            context.intent.name.should.equal("test-abort");
            context.confirming.should.equal("order");

            await Promise.delay(1000).then(function(){
                return;
            })
        });
    });
});

