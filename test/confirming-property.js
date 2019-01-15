"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_option = {
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
};

chai.use(chaiAsPromised);
const should = chai.should();

const emu = new Emulator(messenger_option.name, messenger_option.options);
const user_id = "dummy_user_id";

describe("Test confirming property", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If all the properties are set", async function(){
        it("save them to parent parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-confirming-property"
                    }
                })
            }));

            context.intent.name.should.equal("test-confirming-property");
            context.confirming.should.equal("juminhyo_type");

            context = await emu.send(emu.create_message_event(user_id, "住民票"));

            context.confirmed.juminhyo_type.should.equal("住民票");
            context.confirming.should.equal("whose");

            context = await emu.send(emu.create_message_event(user_id, "個人"));

            context.confirmed.whose.should.equal("個人");
            context.confirming.should.equal("quantity");

            context = await emu.send(emu.create_message_event(user_id, "1"));

            context.confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "住民票",
                whose: "個人",
                quantity: "1"
            }]);
            context.confirming.should.equal("review_juminhyo_list");
            should.not.exist(context.confirmed.juminhyo_type);
            should.not.exist(context.confirmed.whose);
            should.not.exist(context.confirmed.quantity);

            context = await emu.send(emu.create_message_event(user_id, "追加"));

            context.confirming.should.equal("juminhyo_type");

            context = await emu.send(emu.create_message_event(user_id, "住民票除票"));

            context.confirmed.juminhyo_type.should.equal("住民票除票");
            context.confirming.should.equal("quantity");

            context = await emu.send(emu.create_message_event(user_id, "2"));

            context.confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "住民票除票",
                quantity: "2"
            },{
                juminhyo_type: "住民票",
                whose: "個人",
                quantity: "1"
            }]);
            context.confirming.should.equal("review_juminhyo_list");
            should.not.exist(context.confirmed.juminhyo_type);
            should.not.exist(context.confirmed.whose);
            should.not.exist(context.confirmed.quantity);
        });
    });
});

