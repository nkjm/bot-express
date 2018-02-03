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

    describe("Test collect from " + emu.messenger_type, function(){
        let user_id = "collect";

        describe("collect undefined parameter using collect_by_parameter_obj()", function(){
            it("will collect parameter as dynamic parameter.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "juminhyo"
                            },
                            language: "ja"
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking juminhyo type
                    let event = emu.create_message_event(user_id, "本人だけ");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking name.
                    let event = emu.create_message_event(user_id, "中嶋一樹です");
                    context.to_confirm.includes("is_name_correct").should.equal(false);
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now confirming if name is correct.
                    context.to_confirm.includes("is_name_correct").should.equal(true);
                    context.confirming.should.equal("is_name_correct");
                });
            });
        })

        describe("collect optional parameter using collect_by_parameter_key()", function(){
            it("will collect optional parameter.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "juminhyo"
                            },
                            language: "ja"
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking juminhyo type
                    let event = emu.create_message_event(user_id, "本人だけ");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking name.
                    let event = emu.create_message_event(user_id, "中嶋一樹です");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now confirming if name is correct.
                    let event = emu.create_message_event(user_id, "いいえ");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking lastname
                    context.should.have.property("confirming", "lastname");
                    context.to_confirm[0].should.equal("lastname");

                    let event = emu.create_message_event(user_id, "中嶋");
                    return emu.send(event);
                }).then(function(context){
                    context.confirmed.should.have.property("lastname", "中嶋");
                });
            });
        });

        describe("collect required parameter using collect_by_parameter_obj()", function(){
            it("will collect required parameter with overriden message.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "juminhyo"
                            },
                            language: "ja"
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking juminhyo type
                    let event = emu.create_message_event(user_id, "本人だけ");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking name.
                    let event = emu.create_message_event(user_id, "中嶋一樹です");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now confirming if name is correct.
                    let event = emu.create_message_event(user_id, "はい");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking zip code.
                    let event = emu.create_message_event(user_id, "107-0061");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking if address is correct.
                    let event = emu.create_message_event(user_id, "いいえ");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is now asking zip code once again.
                    context.previous.message[0].message.text.should.equal("なんと。もう一度郵便番号うかがってもいいですか？");
                });;
            });
        });
    });

}
