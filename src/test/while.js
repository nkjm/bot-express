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

describe("Test while", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("While 'while' function returns true", async function(){
        it("adds value to confirmed and collect same param again.", async function(){
            let context = await emu.launch("test-while")

            context.intent.name.should.equal("test-while")
            context.confirming.should.equal("fruit_list")
            context = await emu.say("apple")

            context.confirming.should.equal("fruit_list")
            context.confirmed.fruit_list.should.have.lengthOf(1)
            context.confirmed.fruit_list.should.deep.equal(["apple"])
            context = await emu.say("orange")

            context.confirming.should.equal("fruit_list")
            context.confirmed.fruit_list.should.have.lengthOf(2)
            context.confirmed.fruit_list.should.deep.equal(["orange", "apple"])
            context = await emu.say("banana")

            context.confirming.should.equal("fullname")
            context.global.done_preaction.should.equal(true)
            context = await emu.say("Kazuki Nakajima")

            context.confirming.should.equal("phone")
            context = await emu.say("090-1111-2222")

            context.confirming.should.equal("child_name")
            context = await emu.say("Ichiro")

            context.confirming.should.equal("child_age")
            context = await emu.say("4")

            context._parent[0].confirmed.child_list.should.have.lengthOf(1)
            context.confirming.should.equal("child_name")
            context = await emu.say("Jiro")

            context.confirming.should.equal("child_age")
            context = await emu.say("2")

            context._parent[0].confirmed.member_list.should.deep.equal([{
                fullname: "Kazuki Nakajima",
                phone: "090-1111-2222",
                child_list: [{
                    child_name: "Jiro",
                    child_age: "2",
                },{
                    child_name: "Ichiro",
                    child_age: "4"
                }]
            }])

            context.confirming.should.equal("fullname")
            context = await emu.say("Taro Yamada")

            context.confirming.should.equal("phone")
            context = await emu.say("090-3333-4444")

            context.confirming.should.equal("child_name")
            context = await emu.say("Hanako")

            context.confirming.should.equal("child_age")
            context = await emu.say("5")

            context._parent[0].confirmed.child_list.should.have.lengthOf(1)
            context.confirming.should.equal("child_name")
            context = await emu.say("Yoshiko")

            context.confirming.should.equal("child_age")
            context = await emu.say("3")

            should.not.exist(context.confirming)
            context.confirmed.member_list.should.deep.equal([{
                fullname: "Taro Yamada",
                phone: "090-3333-4444",
                child_list: [{
                    child_name: "Yoshiko",
                    child_age: "3",
                },{
                    child_name: "Hanako",
                    child_age: "5"
                }]
            },{
                fullname: "Kazuki Nakajima",
                phone: "090-1111-2222",
                child_list: [{
                    child_name: "Jiro",
                    child_age: "2",
                },{
                    child_name: "Ichiro",
                    child_age: "4"
                }]
            }])
        })
    })

    describe("If 'while' function returns false before collecting parameter", async function(){
        it("skips collecting it.", async function(){
            let context = await emu.launch("test-while", {
                skip_fruit_list: true
            })

            context.confirming.should.equal("fullname")
        })
    })

    describe("If 'while' function returns false before collecting parameter which has sub_parameter", async function(){
        it("skips collecting it.", async function(){
            let context = await emu.launch("test-while", {
                skip_member_list: true
            })

            context.confirming.should.equal("fruit_list")
            context = await emu.say("apple")

            context.confirming.should.equal("fruit_list")
            context.confirmed.fruit_list.should.have.lengthOf(1)
            context.confirmed.fruit_list.should.deep.equal(["apple"])
            context = await emu.say("orange")

            context.confirming.should.equal("fruit_list")
            context.confirmed.fruit_list.should.have.lengthOf(2)
            context.confirmed.fruit_list.should.deep.equal(["orange", "apple"])
            context = await emu.say("banana")

            should.not.exist(context.confirming)
        })
    })
})

