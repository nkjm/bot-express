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

describe("Test _collect", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If condition returns true", async function(){
        it("collects the parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-_collect"
                    }
                })
            }));

            context.intent.name.should.equal("test-_collect");
            context.confirming.should.equal("juminhyo_type");

            context = await emu.send(emu.create_message_event(user_id, "住民票"));

            context.confirming.should.equal("whose");
            context.to_confirm[0].should.equal("whose");
        });
    });

    describe("If condition returns false", async function(){
        it("does not collect the parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-_collect"
                    }
                })
            }));

            context.intent.name.should.equal("test-_collect");
            context.confirming.should.equal("juminhyo_type");

            context = await emu.send(emu.create_message_event(user_id, "記載事項証明"));

            context.to_confirm.should.have.lengthOf(0);
            should.not.exist(context.confirming);
        });
    });

    describe("If condition returns true in optional parameter", async function(){
        it("collects the parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-_collect"
                    }
                })
            }));

            context.intent.name.should.equal("test-_collect");
            context.confirming.should.equal("juminhyo_type");

            context = await emu.send(emu.create_message_event(user_id, "住民票"));

            context.confirming.should.equal("whose");
            
            context = await emu.send(emu.create_message_event(user_id, "世帯全員"));

            context.confirming.should.equal("quantity");
        });
    });

    describe("If condition returns false in optional parameter", async function(){
        it("does not collect the parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-_collect"
                    }
                })
            }));

            context.intent.name.should.equal("test-_collect");
            context.confirming.should.equal("juminhyo_type");

            context = await emu.send(emu.create_message_event(user_id, "住民票除票"));

            context.confirming.should.equal("whose");
            
            context = await emu.send(emu.create_message_event(user_id, "世帯全員"));

            context.to_confirm.should.have.lengthOf(0);
            should.not.exist(context.confirming);
        });
    });
});

