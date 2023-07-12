"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const user_id = "custom-message";
const emu = new Emulator(
    "line", 
    { line_channel_secret: process.env.LINE_CHANNEL_SECRET }, 
    user_id
)

chai.use(chaiAsPromised);
const should = chai.should();

describe("Test setting custom message in skill", async function(){
    it("should load specified message.", async function(){
        let context = await emu.launch("test-custom-message")
        context.intent.name.should.equal("test-custom-message")
        context.confirming.should.equal("hoge")
        context.previous.message[0].message.text.should.equal(`こんにちは。`)
    })
})