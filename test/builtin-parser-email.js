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

describe("Test builtin email parser", async function(){

    describe("Valid email", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-email"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-email");
            context.confirming.should.equal("email");

            context = await emu.send(emu.create_message_event(user_id, "nkjm.kzk@gmail.com"));

            // Test
            context.confirmed.email.should.equal("nkjm.kzk@gmail.com");
        });
    });

    describe("Invalid email", async function(){
        it("will be rejected.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-email"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-email");
            context.confirming.should.equal("email");

            context = await emu.send(emu.create_message_event(user_id, "nkjm.kzk.gmail.com"));

            // Test
            should.not.exist(context.confirmed.email);
        });
    });

});
