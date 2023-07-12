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

describe("Test builtin datetime parser", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("Before min", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-datetime", {
                test_case: "minmax"
            })
            context.intent.name.should.equal("test-builtin-parser-datetime")
            context.confirming.should.equal("minmax")

            context = await emu.say("2019-11-05T09:00")
            context.confirming.should.equal("minmax")
        })
    })

    describe("After max", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-datetime", {
                test_case: "minmax"
            })
            context.intent.name.should.equal("test-builtin-parser-datetime")
            context.confirming.should.equal("minmax")

            context = await emu.say("2019-11-11T10:16")
            context.confirming.should.equal("minmax")
        })
    })

    describe("Between min and max", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-datetime", {
                test_case: "minmax"
            })
            context.intent.name.should.equal("test-builtin-parser-datetime")
            context.confirming.should.equal("minmax")

            context = await emu.say("2019-11-05T09:01")
            context.confirmed.minmax.should.equal("2019-11-05T09:01")
        })
    })
})