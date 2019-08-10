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

describe("Test on_abend", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    });

    describe("If error occured in begin", async function(){
        it("run on_abend.", async function(){
            let context
            try {
                context = await emu.send(emu.create_postback_event(user_id, {
                    data: JSON.stringify({
                        type: "intent",
                        language: "ja",
                        intent: {
                            name: "test_on_abend",
                            parameters: {
                                bom: true
                            }
                        }
                    })
                }))
            } catch(e){
                e.message.should.equal(`bom_in_begin`)
            }
        })
    })

    describe("If error occured in reaction", async function(){
        it("run on_abend.", async function(){
            let context
            context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test_on_abend",
                    }
                })
            }))

            context.intent.name.should.equal("test_on_abend")
            context.confirming.should.equal("a")
            try {
                context = await emu.send(emu.create_message_event(user_id, "bom"))
            } catch(e){
                e.message.should.equal(`bom_in_reaction`)
            }
        })
    })

    describe("If error occured in finish", async function(){
        it("run on_abend.", async function(){
            let context
            context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test_on_abend",
                    }
                })
            }))

            context.intent.name.should.equal("test_on_abend")
            context.confirming.should.equal("a")
            try {
                context = await emu.send(emu.create_message_event(user_id, "hoge"))
            } catch(e){
                e.message.should.equal(`bom_in_finish`)
            }
        })
    })
})