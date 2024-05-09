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

let emu = new Emulator(messenger_option.name, messenger_option.options);

let user_id = "dummy_user_id";

describe("Inexistent skill in start conversation flow", function(){
    it("should be ignored.", async function(){
        this.timeout(15000);

        await emu.clear_context(user_id);

        let event = emu.create_postback_event(user_id, {data: JSON.stringify({
            _type: "intent",
            intent: {
                name: "dummy-skill"
            }
        })});
        let context = await emu.send(event);

        // Test
        should.not.exist(context);
    });
});

describe("Inexistent skill in reply flow", function(){
    it("should be ignored.", async function(){
        this.timeout(15000);

        await emu.clear_context(user_id);

        let event = emu.create_postback_event(user_id, {data: JSON.stringify({
            _type: "intent",
            intent: {
                name: "handle-pizza-order"
            }
        })});
        let context = await emu.send(event);

        // Test
        context.intent.name.should.equal("handle-pizza-order");
        context.confirming.should.equal("pizza");

        event = emu.create_message_event(user_id, "dummy-skill");
        context = await emu.send(event);

        // Test
        context.intent.name.should.equal("handle-pizza-order");
        context.confirming.should.equal("pizza");
    });
});

describe("Inexistent skill in btw flow", function(){
    it("should be ignored.", async function(){
        this.timeout(15000);

        await emu.clear_context(user_id);

        let event = emu.create_postback_event(user_id, {data: JSON.stringify({
            _type: "intent",
            intent: {
                name: "say-welcome"
            }
        })});
        let context = await emu.send(event);

        // Test
        context.intent.name.should.equal("say-welcome");

        event = emu.create_message_event(user_id, "dummy-skill");
        context = await emu.send(event);

        // Test
        context.intent.name.should.equal("say-welcome");
    });
});

describe("Inexistent skill in push flow", function(){
    it("should be ignored.", async function(){
        this.timeout(15000);

        await emu.clear_context(user_id);

        let event = {
            type: "bot-express:push",
            to: {
                type: "user",
                userId: user_id
            },
            intent: {
                name: "dummy-skill"
            },
            language: "ja"
        }
        let context = await emu.send(event);

        // Test
        should.not.exist(context);
    });
});