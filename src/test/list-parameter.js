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

describe("Test list parameter", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If list is true", async function(){
        it("adds value to list.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-list-parameter",
                        parameters: {
                            default_param: "hoge",
                            list_param_default: "hoge1"
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-list-parameter");
            context.confirmed.default_param.should.equal("hoge");
            context.confirmed.list_param_default.should.deep.equal(["hoge1"]);
            context.confirming.should.equal("list_param_default");

            context = await emu.send(emu.create_message_event(user_id, "hoge2"));

            context.confirmed.list_param_default.should.deep.equal(["hoge2", "hoge1"]);
        });
    });

    describe("If list.order is new", async function(){
        it("adds value in newest first.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-list-parameter",
                        parameters: {
                            default_param: "hoge",
                            list_param_default: "hoge1"
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-list-parameter");
            context.confirming.should.equal("list_param_default");

            context = await emu.send(emu.create_message_event(user_id, "hoge2"));

            context.confirming.should.equal("list_param_newest_first");

            context = await emu.send(emu.create_message_event(user_id, "hoge1"));

            context.confirming.should.equal("list_param_newest_first");

            context = await emu.send(emu.create_message_event(user_id, "hoge2"));

            context.confirmed.list_param_newest_first.should.deep.equal(["hoge2", "hoge1"]);
        });
    });

    describe("If list.order is new", async function(){
        it("adds value in newest first.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-list-parameter",
                        parameters: {
                            default_param: "hoge",
                            list_param_default: "hoge1"
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-list-parameter");
            context.confirming.should.equal("list_param_default");

            context = await emu.send(emu.create_message_event(user_id, "hoge2"));
            
            context.confirming.should.equal("list_param_newest_first");

            context = await emu.send(emu.create_message_event(user_id, "hoge1"));

            context.confirming.should.equal("list_param_newest_first");

            context = await emu.send(emu.create_message_event(user_id, "hoge2"));

            context.confirming.should.equal("list_param_oldest_first");

            context = await emu.send(emu.create_message_event(user_id, "hoge1"));

            context.confirming.should.equal("list_param_oldest_first");

            context = await emu.send(emu.create_message_event(user_id, "hoge2"));

            context.confirmed.list_param_oldest_first.should.deep.equal(["hoge1", "hoge2"]);
        });
    });
});

