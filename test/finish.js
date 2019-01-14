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
const should = chai.should();
const user_id = "finish";

chai.use(chaiAsPromised);

describe("Test flow.finish()", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If there is parameter to confirm", async function(){
        it("collects the parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-finish",
                        parameters: {
                            heard: "himitsu"
                        }
                    },
                    language: "ja"
                })
            }));

            context.intent.name.should.equal("test-finish");
            context.confirming.should.equal("req_a");
        });
    });

    describe("If there is no parameter to confirm", async function(){
        it("runs finish() of skill.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-finish",
                        parameters: {
                            req_a: "finish",
                            heard: "himitsu"
                        }
                    },
                    language: "ja"
                })
            }));

            context.intent.name.should.equal("test-finish");
            should.not.exist(context.confirming);
        })
    });

    describe("If developer collect parameter in finish", async function(){
        it("runs finish() recursively and collect the parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-finish",
                        parameters: {
                            req_a: "unknown",
                            heard: "himitsu"
                        }
                    },
                    language: "ja"
                })
            }));

            context.intent.name.should.equal("test-finish");
            context.confirming.should.equal("unknown");
        })
    });

    describe("If developer collect parameter in finish and it exists in context.heard", async function(){
        it("runs finish() recursively but process_parameters() apply it and finish.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-finish",
                        parameters: {
                            req_a: "heard",
                            heard: "himitsu"
                        }
                    },
                    language: "ja"
                })
            }));

            context.intent.name.should.equal("test-finish");
            should.not.exist(context.confirming);
        })
    });
});
