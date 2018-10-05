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

describe("Test parser", async function(){
    describe("Valid parameter value is included in intent response", async function(){
        it("will be applied in advance", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-parser",
                        parameters: {
                            function_based: "本人だけ"
                        }
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-parser");
            context.confirmed.function_based.should.equal("本人だけ");
        });
    })

    describe("Invalid parameter value is included in intent response", async function(){
        it("will be rejected", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-parser",
                        parameters: {
                            function_based: "他人の分"
                        }
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-parser");
            should.not.exist(context.confirmed.function_based);
        });
    })

    describe("Parameter is included in intent response but there is no corresponding parameter in skill", async function(){
        it("will be ignored", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-parser",
                        parameters: {
                            dummy_param: "dummy_value"
                        }
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-parser");
            context.confirming.should.equal("function_based");
        });
    })

    describe("Function based parser", async function(){
        it("will run function", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-parser",
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-parser");
            context.confirming.should.equal("function_based");
            
            context = await emu.send(emu.create_message_event(user_id, "他人の分"));

            should.not.exist(context.confirmed.function_based);
            context.previous.message[0].message.text.should.equal("「世帯全員分」または「本人だけ」とお答えください。");

            context = await emu.send(emu.create_message_event(user_id, "本人だけ"));

            context.confirmed.function_based.should.equal("本人だけ")
        });
    });

    describe("No parser", async function(){
        it("will apply the value as it is unless the value is empty.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-parser",
                        parameters: {
                            function_based: "本人だけ"
                        }
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-parser");
            context.confirming.should.equal("no_parser");

            event = emu.create_message_event(user_id, "中嶋一樹");
            context = await emu.send(event);

            context.confirmed.no_parser.should.equal("中嶋一樹");
        });
    });
});
