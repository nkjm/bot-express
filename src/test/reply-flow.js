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
}/*,{
    name: "facebook",
    options: {
        facebook_app_secret: process.env.FACEBOOK_APP_SECRET
    }
}*/];

chai.use(chaiAsPromised);
const should = chai.should();
const user_id = "dummy_user_id";

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test reply flow from " + emu.messenger_type, async function(){
        beforeEach(async () => {
            await emu.clear_context(user_id);
        })

        describe("Correct answer", async function(){
            it("will be accepted and fires reaction.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ピザを注文したいのですが"));

                context.intent.name.should.equal("handle-pizza-order");
                context.confirming.should.equal("pizza");

                context = await emu.send(emu.create_message_event(user_id, "マルゲリータで"));

                context.should.have.property("_flow").and.equal("reply");
                context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                context.should.have.property("confirming").and.deep.equal("size");
                context.should.have.property("to_confirm").have.lengthOf(3);

                // Also fires reaction.
                context.previous.message.should.have.lengthOf(5);
                context.previous.message[1].message.text.should.equal("マルゲリータですね。ありがとうございます。");
            });
        });

        describe("Incorrect answer", async function(){
            it("will be rejected and bot asks same parameter.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ピザを注文したいのですが"));
                context = await emu.send(emu.create_message_event(user_id, "ジェノベーゼで"));

                context.should.have.property("_flow").and.equal("reply");
                context.should.have.property("confirmed").and.deep.equal({});
                context.should.have.property("confirming").and.deep.equal("pizza");
                context.should.have.property("to_confirm").have.lengthOf(4);

                // Bot asking for same parameter.
                context.previous.message.should.have.lengthOf(4);
                context.previous.message[0].message.text.should.equal("恐れ入りますが当店ではマルゲリータかマリナーラしかございません。どちらになさいますか？");
            });
        });

        describe("Restart conversation in the middle of the conversation", async function(){
            it("will trigger restart conversation.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ピザを注文したいのですが"));

                context = await emu.send(emu.create_message_event(user_id, "マルゲリータで"));

                context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});

                context = await emu.send(emu.create_message_event(user_id, "ピザを注文したいのですが"));

                // Bot restarted the conversation
                context.should.have.property("_flow").and.equal("reply");
                context.should.have.property("confirmed").and.deep.equal({});
                context.should.have.property("confirming").and.equal("pizza");
            });
        });

        describe("Change intent in the middle of the conversation", async function(){
            it("will trigger change intent.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ピザを注文したいのですが"));

                context = await emu.send(emu.create_message_event(user_id, "マルゲリータで"));

                context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});

                context = await emu.send(emu.create_message_event(user_id, "やっぱりまた今度にします"));

                should.not.exist(context.confirming);
                context.archive[0].intent.name.should.equal("handle-pizza-order");
            });
        });

        describe("Change intent in the middle of the conversation using intent postback", async function(){
            it("will trigger change intent without parsing value.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ピザを注文したいのですが"));

                context = await emu.send(emu.create_message_event(user_id, "マルゲリータで"));

                context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});

                context = await emu.send(emu.create_postback_event(user_id, {data: JSON.stringify({
                    _type: "intent",
                    intent: {
                        name: "simple-response"
                    }
                })}));

                should.not.exist(context.confirming);
            });
        });

        describe("Change parameter in the middle of the conversation", async function(){
            it("will rejected and bot asks for same parameter. *Will be accepted in the further.", async function(){
                let context = await emu.send(emu.create_message_event(user_id, "ピザを注文したいのですが"));

                context = await emu.send(emu.create_message_event(user_id, "マルゲリータで"));

                context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                context.should.have.property("confirming").and.equal("size");

                context = await emu.send(emu.create_message_event(user_id, "やっぱりマリナーラ"));

                context.should.have.property("_flow").and.equal("reply");
                context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                context.should.have.property("confirming").and.equal("size");
            });
        });
    });
}
