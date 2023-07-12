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
const emu = new Emulator(messenger_option.name, messenger_option.options);

chai.use(chaiAsPromised);
const should = chai.should();
const user_id = "dummy_user_id";

describe("Test intent postback", async function(){

    describe("Intent postback in start conversation flow", async function(){
        it("will set intent.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "handle-pizza-order"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("handle-pizza-order");
        });
    });

    describe("Intent postback in reply flow", async function(){
        it("will change intent.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "handle-pizza-order"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("handle-pizza-order");

            event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "juminhyo"
                }
            })})
            context = await emu.send(event);

            context.intent.name.should.equal("juminhyo");
        });
    });

    describe("Intent postback in reply flow and the intent is same", async function(){
        it("will trigger restart_conversation.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "handle-pizza-order"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("handle-pizza-order");
            context.confirming.should.equal("pizza");

            context = await emu.send(emu.create_message_event(user_id, "マルゲリータ"));

            context.confirming.should.equal("size");

            event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "handle-pizza-order"
                }
            })})
            context = await emu.send(event);

            context.intent.name.should.equal("handle-pizza-order");
            context.confirming.should.equal("pizza");
        });
    });
});
