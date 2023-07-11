"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_options = [{
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();
const user_id = "dummy_user_id";

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options, user_id);

    describe("Test rewind action" + emu.messenger_type, async function(){
        beforeEach(async () => {
            await emu.clear_context(user_id);
        })

        describe("If add rewind action,", async function(){
            it("apply value on rewind.", async function(){

                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-rewind-action"
                    },
                    language: "ja"
                })}))

                context.confirming.should.equal("revert")
                context = await emu.say("revert")

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount.should.equal(0)
                context.rewind.should.have.lengthOf(0)
                context = await emu.say("2")

                context.confirming.should.equal("review")
                context.confirmed.payment_amount.should.equal(400)
                context.rewind.should.have.lengthOf(1)
                context = await emu.modify_previous()

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount.should.equal(0)
                context.rewind.should.have.lengthOf(0)
                context = await emu.say("2")

                context.confirming.should.equal("review")
                context.confirmed.payment_amount.should.equal(400)
                context.rewind.should.have.lengthOf(1)
            })
        })

        describe("If value of rewind action is undefined,", async function(){
            it("delete parameter.", async function(){

                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-rewind-action"
                    },
                    language: "ja"
                })}))

                context.confirming.should.equal("revert")
                context = await emu.say("delete")

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount.should.equal(0)
                context = await emu.say("2")

                context.confirming.should.equal("review")
                context.confirmed.payment_amount.should.equal(400)
                context = await emu.modify_previous()

                context.confirming.should.equal("num_of_seat")
                should.not.exist(context.confirmed.payment_amount)
            })
        })

        describe("If do not add rewind action,", async function(){
            it("does not apply value on rewind.", async function(){

                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-rewind-action"
                    },
                    language: "ja"
                })}))

                context.confirming.should.equal("revert")
                context = await emu.say("no")

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount.should.equal(0)
                context = await emu.say("2")

                context.confirming.should.equal("review")
                context.confirmed.payment_amount.should.equal(400)
                context = await emu.modify_previous()

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount.should.equal(400)
                context = await emu.say("2")

                context.confirming.should.equal("review")
                context.confirmed.payment_amount.should.equal(800)
            })
        })

        describe("If there are multiple actions,", async function(){
            it("revert to first value.", async function(){

                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-rewind-action"
                    },
                    language: "ja"
                })}))

                context.confirming.should.equal("revert")
                context = await emu.say("revert2")

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount.should.equal(0)
                context.rewind.should.have.lengthOf(0)
                context = await emu.say("2")

                context.confirming.should.equal("review")
                context.confirmed.payment_amount.should.equal(800)
                context.rewind.should.have.lengthOf(2)
                context = await emu.modify_previous()

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount.should.equal(0)
                context.rewind.should.have.lengthOf(0)
                context = await emu.say("2")

                context.confirming.should.equal("review")
                context.confirmed.payment_amount.should.equal(800)
                context.rewind.should.have.lengthOf(2)
            })
        })
    })
}
