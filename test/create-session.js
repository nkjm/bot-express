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
const Redis = require("ioredis")
const cache = require("memory-cache")
/**
 * Instantiate redis client
 */
let redis_client
if (process.env.REDIS_URL){
    const options = {}
    if (process.env.REDIS_TLS === true || process.env.REDIS_TLS === "enable"){
        options.tls = {
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        }
    }
    redis_client = new Redis(process.env.REDIS_URL, options)
    cache.put("redis_client", redis_client);
}

const Memory = require("../module/memory")
const memory = new Memory({
    type: process.env.MEMORY_TYPE, // memory-cache | redis 
    retention: Number(process.env.MEMORY_RETENTION),
    options: { // Options for redis
        redis_client: redis_client
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