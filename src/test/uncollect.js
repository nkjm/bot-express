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

describe("Test uncollect", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("By string", async function(){
        it("will uncollect one parameter.", async function(){
            let context

            context = await emu.launch("test-uncollect", {
                test_case: "string"
            })
            context.intent.name.should.equal("test-uncollect")
            context.to_confirm.should.deep.equal(["param_a", "param_c"])
        })
    })

    describe("By array", async function(){
        it("will uncollect multiple parameters.", async function(){
            let context

            context = await emu.launch("test-uncollect", {
                test_case: "array"
            })
            context.intent.name.should.equal("test-uncollect")
            context.to_confirm.should.deep.equal(["param_c"])
        })
    })

    describe("Uncollect collected parameter", async function(){
        it("will remove property from confirmed", async function(){
            let context

            context = await emu.launch("test-uncollect", {
                test_case: "uncollect_collected_parameter"
            })
            context.intent.name.should.equal("test-uncollect")
            context.confirming.should.equal("param_a")

            context = await emu.say("hoge")
            context.confirmed.param_a.should.equal("hoge")
            context.confirming.should.equal("param_b")

            context = await emu.say("uncollect_collected")
            should.not.exist(context.confirmed.param_a)
        })
    })
})