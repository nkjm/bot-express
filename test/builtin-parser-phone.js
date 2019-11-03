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

describe("Test builtin phone parser", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("Invalid chars", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-phone", {
                test_case: "no_policy"
            })
            context.intent.name.should.equal("test-builtin-parser-phone")
            context.confirming.should.equal("no_policy")

            context = await emu.say("090-1111-11a1")
            context.confirming.should.equal("no_policy")
        })
    })

    describe("Number and dash", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-phone", {
                test_case: "no_policy"
            })
            context.intent.name.should.equal("test-builtin-parser-phone")
            context.confirming.should.equal("no_policy")

            context = await emu.say("123456789012345678901234567890123456789-")
            context.confirmed.no_policy.should.equal("123456789012345678901234567890123456789")
        })
    })

    describe("Exceeds default length of 40", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-phone", {
                test_case: "no_policy"
            })
            context.intent.name.should.equal("test-builtin-parser-phone")
            context.confirming.should.equal("no_policy")

            context = await emu.say("12345678901234567890123456789012345678901")
            context.confirming.should.equal("no_policy")
        })
    })

    describe("Exceeds length configured by policy", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-phone", {
                test_case: "length"
            })
            context.intent.name.should.equal("test-builtin-parser-phone")
            context.confirming.should.equal("length")

            context = await emu.say("12345678901")
            context.confirming.should.equal("length")
        })
    })

    describe("Up to length configured by policy", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-phone", {
                test_case: "length"
            })
            context.intent.name.should.equal("test-builtin-parser-phone")
            context.confirming.should.equal("length")

            context = await emu.say("1234567890")
            context.confirmed.length.should.equal("1234567890")
        })
    })
})