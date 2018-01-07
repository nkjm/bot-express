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

    describe("Test message_to_confirm from " + emu.messenger_type, function(){
        let user_id = "message-to-confirm";

        describe("Message made of object", function(){
            it("will be used as it is.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-message-to-confirm"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Now bot is asking pizza type.
                    context.should.have.property("confirming", "pizza");
                    context.previous.message[0].message.altText.should.equal("ご注文のピザはお決まりでしょうか？ マルゲリータ、マリナーラからお選びください。");
                });
            });
        });

        describe("Message made of function - resolve", function(){
            it("will generate message dynamically.", function(){
                this.timeout(5000);

                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event).then(function(context){
                    context.should.have.property("confirming", "size");
                    context.previous.message[0].message.altText.should.equal("マルゲリータですね。サイズはいかがしましょうか？ S、M、Lからお選びください。");
                });
            });
        });

        describe("Message made of function - reject", function(){
            it("will stop processing.", function(){
                this.timeout(5000);

                let event = emu.create_message_event(user_id, "S");
                return emu.send(event).catch(function(error){
                    error.message.should.equal("Could not generate message for some reason.");
                });
            });
        });

        describe("Message made of function - throw error", function(){
            it("will stop processing.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-message-to-confirm"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "マルゲリータ");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "M");
                    return emu.send(event);
                }).catch(function(error){
                    error.message.should.equal("Error occured for some reason.");
                });
            });
        });

    });
}
