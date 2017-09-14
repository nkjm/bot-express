'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

for (let message_platform of message_platform_list){
    describe("change-light-color skill test - from " + message_platform, function(){
        let user_id = "change-light-color";
        let event_type = "message";
        describe("#ライトの色変えて", function(){
            it("goes start conversation flow and confirm the color of light.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色変えて"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", "color");
                        response.should.have.property("to_confirm").have.lengthOf(1);
                        response.to_confirm[0].should.equal("color");
                        response.previous.confirmed.should.deep.equal([]);
                    }
                );
            });
        });
        describe("#赤", function(){
            it("goes reply flow and the color of light is changed to 赤.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "赤")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({color:"FF7B7B"});
                        response.should.have.property("confirming", null);
                        response.should.have.property("to_confirm").and.deep.equal([]);
                        response.previous.confirmed.should.deep.equal(["color"]);
                    }
                );
            });
        });
        describe("#黄", function(){
            it("goes change parameter flow and the color of light is changed to 黄.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "黄")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({color:"FFFA6A"});
                        response.should.have.property("confirming", null);
                        response.should.have.property("to_confirm").and.deep.equal([]);
                        response.previous.confirmed.should.deep.equal(["color"]);
                    }
                );
            });
        });
        describe("#ライトの色を青に変えて", function(){
            it("goes change intent flow and changes the color of light to 青 immediately.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色を青に変えて")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({color:"5068FF"});
                        response.should.have.property("confirming", null);
                        response.should.have.property("to_confirm").and.deep.equal([]);
                        response.previous.confirmed.should.deep.equal(["color"]);
                    }
                );
            });
        });
        describe("#赤", function(){
            it("goes change parameter flow and changes the color of light to 赤.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, event_type, user_id, "赤")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({color:"FF7B7B"});
                        response.should.have.property("confirming", null);
                        response.should.have.property("to_confirm").and.deep.equal([]);
                        response.previous.confirmed.should.deep.equal(["color"]);
                    }
                );
            });
        });
        describe("#黄(postback)", function(){
            it("goes change parameter flow and changes the color of light to 黄.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util.create_req(message_platform, "postback", user_id, "黄")).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({color:"FFFA6A"});
                        response.should.have.property("confirming", null);
                        response.should.have.property("to_confirm").and.deep.equal([]);
                        response.previous.confirmed.should.deep.equal(["color"]);
                    }
                );
            });
        });
    });
}
