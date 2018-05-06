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

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test handle-pizza-order skill from " + emu.messenger_type, function(){
        let user_id = "handle-pizza-order";

        describe("Invalid answer for pizza", function(){
            it("will be rejected by parser and bot asks same question once again.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "pizza");
                    let event = emu.create_message_event(user_id, "ジェノベーゼで");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirming", "pizza");
                });
            });
        });

        describe("Valid answer for pizza", function(){
            it("will be accepted and bot set pizza マルゲリータ and asks pizza size.", function(){
                this.timeout(15000);

                let event = emu.create_message_event(user_id, "じゃ、マルゲリータ");
                return emu.send(event).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({pizza:"マルゲリータ"});
                    context.should.have.property("confirming", "size");
                });
            });
        });
    });
}
