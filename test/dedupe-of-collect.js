"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_options = [{
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
}];
const user_id = "dummy_user_id";

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Set dedup = true", async function(){
        it("should ask parameter: a once.", async function(){
            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                intent: {
                    name: "test-dedup-of-collect"
                },
                language: "ja"
            })})
            let context = await emu.send(event);

            context.intent.name.should.equal("test-dedup-of-collect");
            context.confirming.should.equal("dedup");

            event = emu.create_message_event(user_id, "true");
            context = await emu.send(event);

            context.confirming.should.equal("a");

            event = emu.create_message_event(user_id, "hoge");
            context = await emu.send(event);

            should.not.exist(context.confirming);
        });
    });

    describe("Set dedup = false and pass key to object", async function(){
        it("should ask parameter: a twice.", async function(){
            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                intent: {
                    name: "test-dedup-of-collect"
                },
                language: "ja"
            })})
            let context = await emu.send(event);

            context.intent.name.should.equal("test-dedup-of-collect");
            context.confirming.should.equal("dedup");

            event = emu.create_message_event(user_id, "false_with_key");
            context = await emu.send(event);

            context.confirming.should.equal("a");

            event = emu.create_message_event(user_id, "hoge1");
            context = await emu.send(event);

            context.confirming.should.equal("a");
            context.confirmed.a.should.equal("hoge1");

            event = emu.create_message_event(user_id, "hoge2");
            context = await emu.send(event);

            should.not.exist(context.confirming);
            context.confirmed.a.should.equal("hoge2");
        });
    });

    describe("Set dedup = false and pass object to collect()", async function(){
        it("should ask parameter: a twice.", async function(){
            await emu.clear_context(user_id);

            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                intent: {
                    name: "test-dedup-of-collect"
                },
                language: "ja"
            })})
            let context = await emu.send(event);

            context.intent.name.should.equal("test-dedup-of-collect");
            context.confirming.should.equal("dedup");

            event = emu.create_message_event(user_id, "false_with_object");
            context = await emu.send(event);

            context.confirming.should.equal("a");

            event = emu.create_message_event(user_id, "hoge1");
            context = await emu.send(event);

            context.confirming.should.equal("a");
            context.confirmed.a.should.equal("hoge1");

            event = emu.create_message_event(user_id, "hoge2");
            context = await emu.send(event);

            should.not.exist(context.confirming);
            context.confirmed.a.should.equal("hoge2");
        });
    });
}
