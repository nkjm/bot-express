"use strict";

require("dotenv").config();

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Emulator from "../test-util/emulator";

chai.use(chaiAsPromised);
const should = chai.should();
const user_id = "dummy_user_id";

const messenger_option = {
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    }
};
const emu = new Emulator(messenger_option.name, messenger_option.options, user_id);


describe("Test generating sub parameter", async function(){

    describe("Enter 1 record", async function(){
        it("will be stored in list parameter.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                type: "intent",
                intent: {
                    name: "test-generating-sub-parameter"
                }
            })});
            let context = await emu.send(event);

            context.intent.name.should.equal("test-generating-sub-parameter");
            context.confirming.should.equal("phone");
            context = await emu.send(emu.create_message_event(user_id, "09011223344"));

            context.confirming.should.equal("zip_code");
            context = await emu.send(emu.create_message_event(user_id, "1070062"));

            should.not.exist(context.confirming)
            context.previous.message[0].message.text.should.equal(`phone: 09011223344, zip_code: 1070062`)
        });
    });
});
