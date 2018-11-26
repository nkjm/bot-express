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

    describe("Test handle-pizza-order skill from " + emu.messenger_type, function(){
        let user_id = "handle-pizza-order";

        describe("Identifiable request", function(){
            it("will trigger the skill and go through start conversation flow.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({});
                    context.should.have.property("confirming", "pizza");
                    context.should.have.property("to_confirm").have.lengthOf(4);
                    context.to_confirm[0].should.equal("pizza");
                    context.to_confirm[1].should.equal("size");
                    context.to_confirm[2].should.equal("address");
                    context.to_confirm[3].should.equal("name");
                    context.previous.confirmed.should.deep.equal([]);
                    context.previous.message.should.have.lengthOf(2);
                });
            });
        });

        describe("Invalid answer for pizza", function(){
            it("will be rejected by parser and bot asks same question once again.", function(){
                this.timeout(15000);

                let event = emu.create_message_event(user_id, "ジェノベーゼで。");
                return emu.send(event).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({});
                    context.should.have.property("confirming", "pizza");
                    context.should.have.property("to_confirm").have.lengthOf(4);
                    context.to_confirm[0].should.equal("pizza");
                    context.to_confirm[1].should.equal("size");
                    context.to_confirm[2].should.equal("address");
                    context.to_confirm[3].should.equal("name");
                    context.previous.confirmed.should.deep.equal([]);
                    context.previous.message.should.have.lengthOf(4);
                });
            });
        });

        describe("Valid answer for pizza", function(){
            it("will be accepted and bot set pizza マルゲリータ and asks pizza size.", function(){
                this.timeout(15000);

                let event = emu.create_message_event(user_id, "マルゲリータで。");
                return emu.send(event).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({pizza:"マルゲリータ"});
                    context.should.have.property("confirming", "size");
                    context.should.have.property("to_confirm").have.lengthOf(3);
                    context.to_confirm[0].should.equal("size");
                    context.to_confirm[1].should.equal("address");
                    context.to_confirm[2].should.equal("name");
                    context.previous.confirmed.should.deep.equal(["pizza"]);
                    context.previous.message.should.have.lengthOf(7);
                });
            });
        });

        describe("Valid answer for size", function(){
            it("goes reply flow and size is set to M.", function(){
                this.timeout(15000);

                let event = emu.create_message_event(user_id, "Mサイズで。");
                return emu.send(event).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({pizza:"マルゲリータ", size:"M"});
                    context.should.have.property("confirming", "address");
                    context.should.have.property("to_confirm").have.lengthOf(2);
                    context.to_confirm[0].should.equal("address");
                    context.to_confirm[1].should.equal("name");
                    context.previous.confirmed.should.deep.equal(["size","pizza"]);
                });
            });
        });

        describe("Valid answer for address", function(){
            it("goes reply flow and address is set to 港区北青山1-1-1.", function(){
                this.timeout(15000);

                let event = emu.create_message_event(user_id, "港区北青山1-1-1");
                return emu.send(event).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({
                        pizza:"マルゲリータ",
                        size:"M",
                        address:{
                            address: "港区北青山1-1-1",
                            latitude: null,
                            longitude: null
                        }
                    });
                    context.should.have.property("confirming", "name");
                    context.should.have.property("to_confirm").have.lengthOf(1);
                    context.to_confirm[0].should.equal("name");
                    context.previous.confirmed.should.deep.equal(["address","size","pizza"]);
                });
            });
        });

        describe("Valid answer for name", function(){
            it("goes reply flow and skill completed.", function(){
                this.timeout(15000);

                let event = emu.create_message_event(user_id, "中嶋一樹");
                return emu.send(event).then(function(context){
                    context._clear.should.equal(true);
                });
            });
        });

        describe("Identifiable request with valid parameter", function(){
            it("goes start conversation flow and pizza type and size are set. And confirm address to delivery.", function(){
                this.timeout(15000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "マリナーラのLサイズをお願いしたいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.should.have.property("confirmed").and.deep.equal({
                        pizza:"マリナーラ",
                        size:"L"
                    });
                    context.should.have.property("confirming", "address");
                    context.should.have.property("to_confirm").have.lengthOf(2);
                    context.to_confirm[0].should.equal("address");
                    context.to_confirm[1].should.equal("name");
                });
            });
        });

        describe("Geo message", function(){
            it("goes reply flow and address, latitude, longitude are set.", function(){
                this.timeout(15000);

                let event;
                if (emu.messenger_type == "line"){
                    event = emu.create_message_event(user_id, {
                        "id": "dummy",
                        "type": "location",
                        "title": "my location",
                        "address": "〒150-0002 東京都渋谷区渋谷２丁目２１−１",
                        "latitude": 35.65910807942215,
                        "longitude": 139.70372892916203
                    });
                } else if (emu.messenger_type == "facebook"){
                    event = emu.create_message_event(user_id, {
                        "mid":"mid.1458696618141:b4ef9d19ec21086067",
                        "seq":51,
                        "attachments":[{
                            "type":"location",
                            "payload":{
                                "coordinates": {
                                    "lat": 35.65910807942215,
                                    "long": 139.70372892916203
                                }
                            }
                        }]
                    });
                }

                return emu.send(event).then(function(context){
                    context.should.have.property("confirmed").and.have.property("pizza").and.equal("マリナーラ");
                    context.should.have.property("confirmed").and.have.property("size").and.equal("L");
                    if (emu.messenger_type == "line"){
                        context.should.have.property("confirmed").and.have.property("address").and.have.property("address").and.equal("〒150-0002 東京都渋谷区渋谷２丁目２１−１");
                    } else if (emu.messenger_type == "facebook"){
                        context.should.have.property("confirmed").and.have.property("address").and.have.property("address").and.equal(null);
                    }
                    context.should.have.property("confirmed").and.have.property("address").and.have.property("latitude").and.equal(35.65910807942215);
                    context.should.have.property("confirmed").and.have.property("address").and.have.property("longitude").and.equal(139.70372892916203);
                    context.should.have.property("confirming", "name");
                    context.should.have.property("to_confirm").have.lengthOf(1);
                    context.to_confirm[0].should.equal("name");
                });
            });
        });
    });
}
