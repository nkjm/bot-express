"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");

chai.use(chaiAsPromised);
const should = chai.should();


describe("Test compile message from line", function(){
    const messenger_option = {
        name: "line",
        options: {
            line_channel_secret: process.env.LINE_CHANNEL_SECRET
        }
    }
    const emu = new Emulator(messenger_option.name, messenger_option.options);
    const user_id = "translation";

    describe("handle-pizza-order-in-various-format", function(){
        it(`will translate message object.`, function(){
            this.timeout(8000);

            return emu.clear_context(user_id).then(function(){
                let event = emu.create_postback_event(user_id, {
                    data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "handle-pizza-order-in-various-format"
                        },
                        language: "en"
                    })
                });
                return emu.send(event);
            }).then(function(context){
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    type: "text",
                    text: "What is your order pizza?"
                });
                let event = emu.create_message_event(user_id, "Margherita");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button postback.
                context.should.have.property("confirmed").and.deep.equal({line_text: "マルゲリータ"});
                context.translation.should.equal("マルゲリータ");
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    type: "template",
                    altText: "Please select your order pizza.",
                    template: {
                        type: "buttons",
                        text: "Please select your order pizza.",
                        actions: [
                            {type:"postback",label:"Margherita",data:"マルゲリータ"},
                            {type:"postback",label:"Marinara",data:"マリナーラ"},
                            {type:"postback",label:"Capricciosa",data:"カプリチョーザ"},
                            {type:"postback",label:"Quattro formmage",data:"クワトロフォルマッジ"}
                        ]
                    }
                });
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button message.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    type: "template",
                    altText: "Please select your order pizza.",
                    template: {
                        type: "buttons",
                        text: "Please select your order pizza.",
                        actions: [
                            {type:"message",label:"Margherita",text:"Margherita"},
                            {type:"message",label:"Marinara",text:"Marinara"},
                            {type:"message",label:"Capricciosa",text:"Capricciosa"},
                            {type:"message",label:"Quattro formmage",text:"Quattro formmage"}
                        ]
                    }
                });
                let event = emu.create_message_event(user_id, "Margherita");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button uri.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    type: "template",
                    altText: "Please select your order pizza.",
                    template: {
                        type: "buttons",
                        text: "Please select your order pizza.",
                        actions: [
                            {type:"postback",label:"Margherita",data:"マルゲリータ"},
                            {type:"postback",label:"Marinara",data:"マリナーラ"},
                            {type:"uri", label: "All menus", uri:"https://www.dominos.jp/order/pizza/search/"}
                        ]
                    }
                });
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            })
        })
    });
});
