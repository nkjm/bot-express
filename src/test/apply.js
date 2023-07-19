"use strict"; 
require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const should = chai.should();
const Emulator = require("../test-util/emulator");
const BOT_LANGUAGE = "ja";
const SENDER_LANGUAGE = "ja";
const emu = new Emulator(
    "line", 
    { line_channel_secret: process.env.LINE_CHANNEL_SECRET }, 
    process.env.TEST_USER_ID
)

chai.use(chaiAsPromised);

describe("Test apply", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("If it returns value,", async function(){
        it("is applied and no message will be sent.", async function(){
            let context = await emu.launch("test-apply", {
                fruit_list_to_apply: ["orange", "banana"]
            })
            context.intent.name.should.equal("test-apply")
            should.not.exist(context.confirming)
        })
    })

    describe("If it does not return value,", async function(){
        it("collects parameter as usual", async function(){
            let context = await emu.launch("test-apply")
            context.intent.name.should.equal("test-apply")
            context.confirming.should.equal("fruit_list")
        })
    })
})