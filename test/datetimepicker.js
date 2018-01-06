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

    describe("Test datetimepicker from " + emu.messenger_type, function(){
        let user_id = "datetimepicker";

        describe("Buttons Template which includes just 1 button which is datetimepicker", function(){
            it("will be processed and selected date should be saved in confirmed.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-datetimepicker"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot is what test case to perform.
                    let event = emu.create_message_event(user_id, "buttons_date_only");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is asking date.
                    context.previous.message[0].message.should.have.property("template").and.deep.equal({
                        type: "buttons",
                        text: "日にちを教えてください",
                        actions: [
                            {type: "datetimepicker", label: "日にちを選択", mode: "date", data: "dummy"}
                        ]
                    });
                    let event = emu.create_postback_event(user_id, {
                        data: "dummy",
                        params: {
                            date: "2017-09-08"
                        }
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot has accepted the date.
                    context.confirmed.should.have.property("buttons_date_only").and.equal("2017-09-08");
                });

            });
        });

        describe("Buttons Template which includes 2 buttons which is url and datetimepicker", function(){
            it("will be processed and selected date should be saved in confirmed.", function(){
                this.timeout(5000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "test-datetimepicker"
                            }
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot is what test case to perform.
                    let event = emu.create_message_event(user_id, "buttons_date_and_url");
                    return emu.send(event);
                }).then(function(context){
                    // Bot is asking date.
                    context.previous.message[0].message.should.have.property("template").and.deep.equal({
                        type: "buttons",
                        text: "日にちを教えてください",
                        actions: [
                            {type: "uri", label: "詳細を見る", uri: "https://www.linecorp.com"},
                            {type: "datetimepicker", label: "日にちを選択", mode: "date", data: "dummy"}
                        ]
                    });
                    let event = emu.create_postback_event(user_id, {
                        data: "dummy",
                        params: {
                            date: "2017-09-08"
                        }
                    });
                    return emu.send(event);
                }).then(function(context){
                    // Bot has accepted the date.
                    context.confirmed.should.have.property("buttons_date_and_url").and.equal("2017-09-08");
                });

            });
        });
    });
}
