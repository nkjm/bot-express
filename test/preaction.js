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

describe("Test preaction", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("If parameter is collected by _collect", async function(){
        it("is performed.", async function(){
            let context

            context = await emu.launch("test-preaction")
            context.intent.name.should.equal("test-preaction")
            context.confirming.should.equal("shelter")
            context.global.shelter_type_list.should.have.lengthOf(2)
        })
    })

    describe("If parameter is processed by process_parameters", async function(){
        it("is performed.", async function(){
            let context

            context = await emu.launch("test-preaction", {
                shelter: "El Sol"
            })
            context.intent.name.should.equal("test-preaction")
            context.confirming.should.equal("shelter")
            context.global.shelter_type_list.should.have.lengthOf(2)
        })
    })

    describe("If parameter is processed by bot.apply_parameter() and preact is true", async function(){
        it("is performed.", async function(){
            let context

            context = await emu.launch("test-preaction", {
                shelter: "Land Rock"
            })
            context.intent.name.should.equal("test-preaction")
            context.confirming.should.equal("tent")
            context.global.tent_type_list.should.have.lengthOf(2)
        })
    })

    describe("If parameter is processed by bot.apply_parameter() and preact is false", async function(){
        it("is not performed.", async function(){
            let context

            context = await emu.launch("test-preaction", {
                shelter: "Living Shell"
            })
            context.intent.name.should.equal("test-preaction")
            should.not.exist(context.confirming)
            should.not.exist(context.global.tent_type_list)
        })
    })
})