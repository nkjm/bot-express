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

    describe("Test clear confirmed" + emu.messenger_type, async function(){
        beforeEach(async () => {
            await emu.clear_context(user_id);
        })

        describe("If modify previous,", async function(){
            it("auto applied value should be cleared", async function(){

                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-clear-confirmed"
                    },
                    language: "ja"
                })}))

                context.confirming.should.equal("collect_payment_amount")
                context = await emu.say("yes")

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount_a.should.equal(100)
                context.confirmed.payment_amount_b.should.equal(100)
                context = await emu.modify_previous({ clear_confirmed: true})

                context.confirming.should.equal("collect_payment_amount")
                context.confirmed.payment_amount_a.should.equal(100)
                should.not.exist(context.confirmed.payment_amount_b)
                context = await emu.say("no")

                context.confirming.should.equal("num_of_seat")
                context.confirmed.payment_amount_a.should.equal(100)
                should.not.exist(context.confirmed.payment_amount_b)
                context = await emu.modify_previous({ clear_confirmed: true})

                context.confirming.should.equal("collect_payment_amount")
                context.confirmed.payment_amount_a.should.equal(100)
                should.not.exist(context.confirmed.payment_amount_b)
            })
        })
    })
}
