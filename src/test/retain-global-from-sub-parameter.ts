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


describe("Test retain global from sub parameter", async function(){
    describe("Variable set to context.global in sub parameter", async function(){
        it("will be retained after checking out parent parameter.", async function(){
            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                type: "intent",
                intent: {
                    name: "test-retain-global-from-sub-parameter"
                }
            })});
            let context = await emu.send(event);

            context.confirming.should.equal("fullname");
            context.global.confirming.agreement.ping.should.equal("agreement pong");
            context = await emu.send(emu.create_message_event(user_id, "kazuki nakajima"));

            context.confirming.should.equal("review");
            context.global.confirming.agreement.ping.should.equal("agreement pong");
            context.global.confirming.fullname.ping.should.equal("fullname pong");

            context = await emu.send(emu.create_message_event(user_id, "ok"));
            should.not.exist(context.confirming)
            context.global.confirming.agreement.ping.should.equal("agreement pong");
            context.global.confirming.fullname.ping.should.equal("fullname pong");
        });
    });
});
