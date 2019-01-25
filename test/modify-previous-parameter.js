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
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test modify_previous_parameter from " + emu.messenger_type, async function(){
        beforeEach(async () => {
            await emu.clear_context(user_id);
        })

        describe("Say expression which means modify previous parameter,", async function(){
            it("asks previously confirmed parameter.", async function(){

                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-modify-previous-parameter"
                    },
                    language: "ja"
                })}));

                context.confirming.should.equal("a");
                context = await emu.send(emu.create_message_event(user_id, "a"));

                context.confirming.should.equal("b");
                context.confirmed.a.should.equal("a");
                context.previous.confirmed[0].should.equal("a");
                context.previous.processed[0].should.equal("a");

                context = await emu.send(emu.create_message_event(user_id, "訂正"));

                context.confirming.should.equal("a");
                context.confirmed.a.should.equal("a");
                context.previous.confirmed.should.have.lengthOf(0);
                context.previous.processed.should.have.lengthOf(0);
            })
        })

        describe("If previously processed parameter is not confirmed,", async function(){
            it("rewinds one more processed parameter.", async function(){

                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-modify-previous-parameter"
                    },
                    language: "ja"
                })}));

                context.confirming.should.equal("a");
                context = await emu.send(emu.create_message_event(user_id, "skip"));

                context.confirming.should.equal("c");
                context.confirmed.a.should.equal("skip");
                context.previous.confirmed.should.deep.equal(["a"]);
                context.previous.processed.should.deep.equal(["b", "a"]);

                context = await emu.send(emu.create_message_event(user_id, "訂正"));

                context.confirming.should.equal("a");
                context.confirmed.a.should.equal("skip");
                context.previous.confirmed.should.deep.equal([]);
                context.previous.processed.should.deep.equal([]);

                context = await emu.send(emu.create_message_event(user_id, "a"));

                context.confirming.should.equal("b");
                context.confirmed.a.should.equal("a");
                context.previous.confirmed.should.deep.equal(["a"]);
                context.previous.processed.should.deep.equal(["a"]);
            })
        })

        describe("Trigger modify_previous_parameter by intent postback", async function(){
            it("should ask previously confirmed parameter.", async function(){
                let context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-modify-previous-parameter"
                    },
                    language: "ja"
                })}));

                context.confirming.should.equal("a");

                context = await emu.send(emu.create_message_event(user_id, "a"));

                context.confirming.should.equal("b");

                context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "modify-previous-parameter"
                    }
                })}));

                context.confirming.should.equal("a");
            })
        })
    });
}
