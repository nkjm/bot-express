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

describe("Test translation label", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If sender language has been identified and suitable translation label exists,", async function(){
        it("uses the label.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-translation-label"
                    }
                })
            }));

            context.intent.name.should.equal("test-translation-label");
            context.confirming.should.equal("pizza");
            context.previous.message[0].message.text.should.equal("ピザのタイプは？");

            await emu.clear_context(user_id);

            context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "en",
                    intent: {
                        name: "test-translation-label"
                    }
                })
            }));

            context.intent.name.should.equal("test-translation-label");
            context.confirming.should.equal("pizza");
            context.previous.message[0].message.text.should.equal("Which pizza you like?");
        });
    });

    describe("If sender language has NOT been identified,", async function(){
        it("uses the first label.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-translation-label"
                    }
                })
            }));

            context.intent.name.should.equal("test-translation-label");
            context.confirming.should.equal("pizza");
            context.previous.message[0].message.text.should.equal("ピザのタイプは？");
        });
    });

    describe("If sender language has been identified but suitable translation label does not exist,", async function(){
        it("uses the first label.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "th",
                    intent: {
                        name: "test-translation-label"
                    }
                })
            }));

            context.intent.name.should.equal("test-translation-label");
            context.confirming.should.equal("pizza");
            context.previous.message[0].message.text.should.equal("ピザのタイプは？");
        });
    });

    describe("If option data is provided,", async function(){
        it("uses data and make translation label.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-translation-label",
                        parameters: {
                            pizza: "マリナーラ"
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-translation-label");
            context.confirming.should.equal("review_price");
            context.previous.message[0].message.text.should.equal("1200円です。");

            await emu.clear_context(user_id);

            context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "en",
                    intent: {
                        name: "test-translation-label",
                        parameters: {
                            pizza: "マリナーラ"
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-translation-label");
            context.confirming.should.equal("review_price");
            context.previous.message[0].message.text.should.equal("Amount is 1200 yen.");
        });
    });
});

