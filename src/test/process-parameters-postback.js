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
}/*,{
    name: "facebook",
    options: {
        facebook_app_secret: process.env.FACEBOOK_APP_SECRET
    }
}*/];

chai.use(chaiAsPromised);
const should = chai.should();
const user_id = "dummy_user_id";

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test process parameters postback from " + emu.messenger_type, async function(){
        beforeEach(async () => {
            await emu.clear_context(user_id);
        })

        describe("If 2 parameters are set just in right order,", async function(){
            it("will be all applied in 1 event.", async function(){
                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    type: "intent",
                    intent: {
                        name: "test-process-parameters-postback"
                    }
                })}));

                context.intent.name.should.equal("test-process-parameters-postback");
                context.confirming.should.equal("a");

                context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    type: "process_parameters",
                    parameters: {
                        a: "hoge_a",
                        b: "hoge_b"
                    }
                })}));

                context.confirming.should.equal("c");
                context.confirmed.a.should.equal("hoge_a");
                context.confirmed.b.should.equal("hoge_b");
            });
        });

        describe("If 2 parameters are set but 1 is not for now,", async function(){
            it("will apply 1 parameter and the other is save in heard.", async function(){
                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    type: "intent",
                    intent: {
                        name: "test-process-parameters-postback"
                    }
                })}));

                context.intent.name.should.equal("test-process-parameters-postback");
                context.confirming.should.equal("a");

                context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    type: "process_parameters",
                    parameters: {
                        a: "hoge_a",
                        c: "hoge_c"
                    }
                })}));

                context.confirming.should.equal("b");
                context.confirmed.a.should.equal("hoge_a");
                should.not.exist(context.confirmed.b);
                should.not.exist(context.confirmed.c);
                context.heard.c.should.equal("hoge_c");

                context = await emu.send(emu.create_message_event(user_id, "hoge_b"));
                context.confirmed.b.should.equal("hoge_b");
                context.confirmed.c.should.equal("hoge_c");
                should.not.exist(context.confirming);
            });
        });
    })
}