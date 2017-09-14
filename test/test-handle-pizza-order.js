'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

for (let message_platform of message_platform_list){
    describe("handle-pizza-order skill test - from " + message_platform, function(){
        let user_id = "handle-pizza-order";
        let event_type = "message";
        describe("#ピザを注文したいのですが", function(){
            it("will be recognized and bot asks pizza type.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したいのですが"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", "pizza");
                        response.should.have.property("to_confirm").have.lengthOf(4);
                        response.to_confirm[0].should.equal("pizza");
                        response.to_confirm[1].should.equal("size");
                        response.to_confirm[2].should.equal("address");
                        response.to_confirm[3].should.equal("name");
                        response.previous.confirmed.should.deep.equal([]);
                        response.previous.message.should.have.lengthOf(2);
                    }
                );
            });
        });
        describe("ジェノベーゼで。", function(){
            it("will be rejected by parser and bot asks same question once again.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "ジェノベーゼで。")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", "pizza");
                        response.should.have.property("to_confirm").have.lengthOf(4);
                        response.to_confirm[0].should.equal("pizza");
                        response.to_confirm[1].should.equal("size");
                        response.to_confirm[2].should.equal("address");
                        response.to_confirm[3].should.equal("name");
                        response.previous.confirmed.should.deep.equal([]);
                        response.previous.message.should.have.lengthOf(4);
                    }
                );
            });
        });
        describe("じゃ、マルゲリータで。", function(){
            it("will be accepted and bot set pizza マルゲリータ and asks pizza size.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "マルゲリータで。")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({pizza:"マルゲリータ"});
                        response.should.have.property("confirming", "size");
                        response.should.have.property("to_confirm").have.lengthOf(3);
                        response.to_confirm[0].should.equal("size");
                        response.to_confirm[1].should.equal("address");
                        response.to_confirm[2].should.equal("name");
                        response.previous.confirmed.should.deep.equal(["pizza"]);
                        response.previous.message.should.have.lengthOf(7);
                    }
                );
            });
        });
        describe("Mサイズかな。", function(){
            it("goes reply flow and size is set to M.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "Mサイズで。")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({pizza:"マルゲリータ", size:"M"});
                        response.should.have.property("confirming", "address");
                        response.should.have.property("to_confirm").have.lengthOf(2);
                        response.to_confirm[0].should.equal("address");
                        response.to_confirm[1].should.equal("name");
                        response.previous.confirmed.should.deep.equal(["size","pizza"]);
                    }
                );
            });
        });
        describe("港区北青山1-1-1です", function(){
            it("goes reply flow and address is set to 港区北青山1-1-1.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "港区北青山1-1-1")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({
                            pizza:"マルゲリータ",
                            size:"M",
                            address:{
                                address: "港区北青山1-1-1",
                                latitude: null,
                                longitude: null
                            }
                        });
                        response.should.have.property("confirming", "name");
                        response.should.have.property("to_confirm").have.lengthOf(1);
                        response.to_confirm[0].should.equal("name");
                        response.previous.confirmed.should.deep.equal(["address","size","pizza"]);
                    }
                );
            });
        });
        describe("中嶋一樹と申します", function(){
            it("goes reply flow and skill completed.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "中嶋一樹")).then(
                    function(response){
                        should.not.exist(response);
                    }
                );
            });
        });
        describe("マリナーラのLサイズをお願いしたいのですが", function(){
            it("goes start conversation flow and pizza type and size are set. And confirm address to delivery.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "マリナーラのLサイズをお願いしたいのですが"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({
                            pizza:"マリナーラ",
                            size:"L"
                        });
                        response.should.have.property("confirming", "address");
                        response.should.have.property("to_confirm").have.lengthOf(2);
                        response.to_confirm[0].should.equal("address");
                        response.to_confirm[1].should.equal("name");
                        response.previous.confirmed.should.deep.equal(["size","pizza"]);
                    }
                );
            });
        });
        describe("位置情報", function(){
            it("goes reply flow and address,latitude,longitude are set.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                let payload;
                if (message_platform == "line"){
                    payload = {
                        "id": "325708",
                        "type": "location",
                        "title": "my location",
                        "address": "〒150-0002 東京都渋谷区渋谷２丁目２１−１",
                        "latitude": 35.65910807942215,
                        "longitude": 139.70372892916203
                    }
                } else if (message_platform == "facebook"){
                    payload = {
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
                    }
                }
                return webhook.run(Util.create_req(message_platform, event_type, user_id, payload)).then(
                    function(response){
                        response.should.have.property("confirmed").and.have.property("pizza").and.equal("マリナーラ");
                        response.should.have.property("confirmed").and.have.property("size").and.equal("L");
                        if (message_platform == "line"){
                            response.should.have.property("confirmed").and.have.property("address").and.have.property("address").and.equal("〒150-0002 東京都渋谷区渋谷２丁目２１−１");
                        } else if (message_platform == "facebook"){
                            response.should.have.property("confirmed").and.have.property("address").and.have.property("address").and.equal(null);
                        }
                        response.should.have.property("confirmed").and.have.property("address").and.have.property("latitude").and.equal(35.65910807942215);
                        response.should.have.property("confirmed").and.have.property("address").and.have.property("longitude").and.equal(139.70372892916203);
                        response.should.have.property("confirming", "name");
                        response.should.have.property("to_confirm").have.lengthOf(1);
                        response.to_confirm[0].should.equal("name");
                        response.previous.confirmed.should.deep.equal(["address","size","pizza"]);
                    }
                );
            });
        });
    });
}
