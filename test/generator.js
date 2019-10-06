"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const should = chai.should()
const Emulator = require("../test-util/emulator");
const emu = new Emulator(
    "line", 
    { line_channel_secret: process.env.LINE_CHANNEL_SECRET }, 
    process.env.TEST_USER_ID
)

describe("Test generator", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("If parameter is statically defined as generator", async function(){
        it("generates parameter.", async function(){
            let context

            context = await emu.launch("test-generator")
            context.intent.name.should.equal("test-generator")
            context.confirming.should.equal("zip_code")

            context = await emu.say("10700621")
            context.confirming.should.equal("zip_code")

            context = await emu.say("1070062")
            context.confirming.should.equal("phone")
            context.confirmed.zip_code.should.equal("1070062")
        })
    })
})