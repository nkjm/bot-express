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

describe("Test collect", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("Collect undefined parameter using collect_by_parameter_obj()", async function(){
        it("will collect parameter as dynamic parameter.", async function(){
            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-collect"
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-collect");
            context.confirming.should.equal("req_a");

            context = await emu.send(emu.create_message_event(user_id, "dynamic"));

            context.confirming.should.equal("dynamic");
            context.previous.message[0].message.text.should.equal("dynamic?");
        });
    });

    describe("collect optional parameter using collect_by_parameter_key()", async function(){
        it("will collect optional parameter.", async function(){
            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-collect"
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-collect");
            context.confirming.should.equal("req_a");

            context = await emu.send(emu.create_message_event(user_id, "opt_a_key"));

            context.confirming.should.equal("opt_a");
            context.previous.message[0].message.text.should.equal("opt_a?");
        });
    });

    describe("collect optional parameter using collect_by_parameter_obj()", async function(){
        it("will collect optional parameter with overridden message.", async function(){
            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-collect"
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-collect");
            context.confirming.should.equal("req_a");

            context = await emu.send(emu.create_message_event(user_id, "opt_a_obj"));

            context.confirming.should.equal("opt_a");
            context.previous.message[0].message.text.should.equal("opt_a_obj?");
        });
    });

    describe("collect required parameter using collect_by_parameter_obj()", async function(){
        it("will collect required parameter with overridden message.", async function(){
            let event = emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-collect"
                    }
                })
            });
            let context = await emu.send(event);

            context.intent.name.should.equal("test-collect");
            context.confirming.should.equal("req_a");

            context = await emu.send(emu.create_message_event(user_id, "req_b"));

            context.confirming.should.equal("req_b");
            context.previous.message[0].message.text.should.equal("req_b_obj?");

            context = await emu.send(emu.create_message_event(user_id, "hoge"));

            should.not.exist(context.confirming);
        });
    });

    describe("collect collected parameter again.", async function(){
        it("will collect it once again while retaining old value.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-collect"
                    }
                })
            }));

            context.intent.name.should.equal("test-collect");
            context.confirming.should.equal("req_a");

            context = await emu.send(emu.create_message_event(user_id, "req_b"));

            context.confirming.should.equal("req_b");
            context.confirmed.req_a.should.equal("req_b");

            context = await emu.send(emu.create_message_event(user_id, "re-collect"));

            context.confirming.should.equal("req_a");
            context.confirmed.req_a.should.equal("req_b");

            context = await emu.send(emu.create_message_event(user_id, "hoge"));

            context.confirmed.req_a.should.equal("hoge");
        });
    });
});

