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
const ParserNumber = require("../module/parser/number")
const parser = new ParserNumber()

describe("Test builtin number parser", async function(){

    describe("Less than min", async function(){
        it("will be rejected.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-number"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-number");
            context.confirming.should.equal("minmax");

            context = await emu.send(emu.create_postback_event(user_id, { data: 2 }));

            // Test
            should.not.exist(context.confirmed.minmax);
        });
    });

    describe("More than max", async function(){
        it("will be rejected.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-number"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-number");
            context.confirming.should.equal("minmax");

            context = await emu.send(emu.create_postback_event(user_id, { data: 6 }));

            // Test
            should.not.exist(context.confirmed.minmax);
        });
    });

    describe("Proper value", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-number"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-number");
            context.confirming.should.equal("minmax");

            context = await emu.send(emu.create_postback_event(user_id, { data: 5 }));

            // Test
            context.confirmed.minmax.should.equal(5);
        });
    });

    describe("Number of string", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-number"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-number");
            context.confirming.should.equal("minmax");

            context = await emu.send(emu.create_message_event(user_id, "5"));

            // Test
            context.confirmed.minmax.should.equal(5);
        });
    });

    describe("No policy", async function(){
        it("will accept value as long as begin number.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-number",
                    parameters: {
                        minmax: 5
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-number");
            context.confirming.should.equal("no_policy");

            context = await emu.send(emu.create_message_event(user_id, "abc"));

            // Test
            should.not.exist(context.confirmed.no_policy);

            context = await emu.send(emu.create_message_event(user_id, "123"));

            // Test
            context.confirmed.no_policy.should.equal(123);
        });
    });

    describe("NaN String", async function(){
        it("will be rejected.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-number",
                    parameters: {
                        minmax: 5
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-number");
            context.confirming.should.equal("no_policy");

            context = await emu.send(emu.create_message_event(user_id, "abc"));

            // Test
            should.not.exist(context.confirmed.no_policy);

            context = await emu.send(emu.create_message_event(user_id, "hoge"));

            // Test
            context.confirming.should.equal("no_policy");
        });
    });

    describe("0 as max and provide 1", async function(){
        it("will be rejected.", async function(){
            let e_message
            try {
                await parser.parse(1, { max: 0 })
            } catch(e){
                e_message = e.message
            }
            e_message.should.equal("be_parser__too_large")
        })
    })

    describe("0 as min and provide -1", async function(){
        it("will be rejected.", async function(){
            let e_message
            try {
                await parser.parse(-1, { min: 0 })
            } catch(e){
                e_message = e.message
            }
            e_message.should.equal("be_parser__too_small")
        })
    })
});
