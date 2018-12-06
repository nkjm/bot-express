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
const test_case = "concurrent_request";
const user_id = test_case

const BOT_LANGUAGE = "ja";
const SENDER_LANGUAGE = "ja";

const emu = new Emulator(messenger_option.name, messenger_option.options);

let u = 3;
describe(`${u} user(s).`, async function(){
    it("get reply.", async function(){
        this.timeout(20000);

        let i;

        // Clear context.
        i = 0;
        for (let v of Array.from(Array(u))){
            await emu.clear_context(`${user_id}_${String(i)}`);
            i++;
        }

        i = 0;
        let done_launch_skill = [];
        for (let v of Array.from(Array(u))){
            let event = emu.create_postback_event(`${user_id}_${String(i)}`, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "handle-pizza-order"
                }
            })});
            done_launch_skill.push(emu.send(event));
            i++;
        }

        let contexts = await Promise.all(done_launch_skill);

        // Test
        let user_id_set = new Set();
        for (let context of contexts){
            context.intent.name.should.equal("handle-pizza-order");
            user_id_set.add(context.event.source.userId);
        }
        user_id_set.size.should.equal(3);
    })
});
