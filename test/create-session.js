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
const Memory = require("../module/memory")
const memory = new Memory({
    type: process.env.MEMORY_TYPE, // memory-cache | redis 
    retention: Number(process.env.MEMORY_RETENTION),
    options: { // Options for redis
        url: process.env.REDIS_URL,
        tls: process.env.REDIS_TLS
    }
})


describe("Test create-shelter", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("When executed", async function(){
        it("creates session and return session key.", async function(){
            let context

            context = await emu.launch("test-create-session")
            should.exist(context.session_id)
            const session_id = context.session_id
            context.intent.name.should.equal("test-create-session")
            context.confirming.should.equal("shelter")
            context.global.session_key.should.equal(session_id)
            let session = await memory.get_session(session_id)
            session.should.equal(process.env.TEST_USER_ID)

            context = await emu.say("Land Rock")
            should.not.exist(context.confirming)

            session = await memory.get_session(session_id)
            should.not.exist(session)
        })
    })
})