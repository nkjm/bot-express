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

let emu = new Emulator(messenger_option.name, messenger_option.options);

let user_id = "dummy_user_id";

describe("Unidentifiable message for identify_mind", function(){
    it("switches intent to answer-available-color and get back.", async function(){
        this.timeout(15000);

        await emu.clear_context(user_id);

        let event = emu.create_postback_event(user_id, {data: JSON.stringify({
            _type: "intent",
            intent: {
                name: "handle-pizza-order"
            }
        })});
        let context = await emu.send(event);

        // Test
        context.intent.name.should.equal("handle-pizza-order");
        context.confirming.should.equal("pizza");

        event = emu.create_message_event(user_id, {
            type: "sticker",
            packageId: "1",
            stickerId: "100"
        });
        context = await emu.send(event);

        context.confirming.should.equal("pizza");
        context.previous.message[0].message.text.should.equal("恐れ入りますが当店ではマルゲリータかマリナーラしかございません。どちらになさいますか？");
    });
});
