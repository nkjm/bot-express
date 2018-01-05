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
},{
    name: "facebook",
    options: {
        facebook_app_secret: process.env.FACEBOOK_APP_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test reply flow from " + emu.messenger_type, function(){
        let user_id = "reply-flow";

        describe("Correct answer", function(){
            it("will be accepted and fires reaction.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "マルゲリータで");
                    return emu.send(event);
                }).then(function(context){
                    // Bot has accepted the value for pizza.
                    context.should.have.property("_flow").and.equal("reply");
                    context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                    context.should.have.property("confirming").and.deep.equal("size");
                    context.should.have.property("to_confirm").have.lengthOf(3);

                    // Also fires reaction.
                    context.previous.message.should.have.lengthOf(5);
                    context.previous.message[1].message.text.should.equal("マルゲリータですね。ありがとうございます。");
                });
            });
        });

        describe("Incorrect answer", function(){
            it("will be rejected and bot asks same parameter.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "ジェノベーゼで");
                    return emu.send(event);
                }).then(function(context){
                    // Bot should have rejected the value for pizza.
                    context.should.have.property("_flow").and.equal("reply");
                    context.should.have.property("confirmed").and.deep.equal({});
                    context.should.have.property("confirming").and.deep.equal("pizza");
                    context.should.have.property("to_confirm").have.lengthOf(4);

                    // Bot asking for same parameter.
                    context.previous.message.should.have.lengthOf(4);
                    context.previous.message[0].message.text.should.equal("恐れ入りますが当店ではマルゲリータかマリナーラしかございません。どちらになさいますか？");
                });
            });
        });

        describe("Restart conversation in the middle of the conversation", function(){
            it("will trigger restart conversation.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "マルゲリータで");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    // Bot restarted the conversation
                    context.should.have.property("_flow").and.equal("reply");
                    context.should.have.property("confirmed").and.deep.equal({});
                    context.should.have.property("confirming").and.equal("pizza");
                });
            });
        });

        describe("Change intent in the middle of the conversation", function(){
            it("will trigger change intent.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "マルゲリータで");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                    let event = emu.create_message_event(user_id, "やっぱりまた今度にします");
                    return emu.send(event);
                }).then(function(context){
                    should.not.exist(context);
                });
            });
        });

        describe("Change parameter in the middle of the conversation", function(){
            it("will rejected and bot asks for same parameter. *Will be accepted in the futer.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    let event = emu.create_message_event(user_id, "マルゲリータで");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                    context.should.have.property("confirming").and.equal("size");
                    let event = emu.create_message_event(user_id, "やっぱりマリナーラ");
                    return emu.send(event);
                }).then(function(context){
                    // Bot rejected and asks for same parameter. *This will be accepted in the future.
                    context.should.have.property("_flow").and.equal("reply");
                    context.should.have.property("confirmed").and.deep.equal({pizza: "マルゲリータ"});
                    context.should.have.property("confirming").and.equal("size");
                });
            });
        });
    });
}
