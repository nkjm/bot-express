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
const user_id = "dummy_user_id";
const emu = new Emulator(messenger_option.name, messenger_option.options);

describe("Test builtin parser on demand usage", function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("dialogflow", async function(){
        it("will use builin dialogflow parser.", async function(){
            let context;

            context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-builtin-parser-ondemand"
                    }
                })
            }));

            context.intent.name.should.equal("test-builtin-parser-ondemand");
            context.should.have.property("confirming", "pizza");


            context = await emu.send(emu.create_message_event(user_id, "ジェノベーゼで"));
            context.should.have.property("confirming", "pizza");
            
            context = await emu.send(emu.create_message_event(user_id, "ではマリナーラ"));
            context.should.have.property("confirming", "size");
        });
    });

    describe("list", async function(){
        it("will use builin list parser.", async function(){
            let context;

            context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "test-builtin-parser-ondemand",
                        parameters: {
                            pizza: "マリナーラ"
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-builtin-parser-ondemand");
            context.should.have.property("confirming", "size");

            context = await emu.send(emu.create_message_event(user_id, "hoge"));
            context.should.have.property("confirming", "size");
            
            context = await emu.send(emu.create_message_event(user_id, "M"));
            context.confirmed.size.should.equal("M");
        });
    });
});
