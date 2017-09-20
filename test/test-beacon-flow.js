'use strict';

const message_platform_list = ["line"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

for (let message_platform of message_platform_list){
    describe("beacon-flow test - from " + message_platform, function(){
        let user_id = "beacon-flow";
        let event_type = "beacon";
        describe("beacon_skill not set", function(){
            it("should be skipped", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, {
                            "hwid": "d41d8cd98f",
                            "type": "enter"
                        }));
                    }
                ).then(
                    function(response){
                        should.not.exist(response);
                    }
                );
            });
        });
        describe("beacon enter event", function(){
            it("should be processed successfully using survey skill.", function(){
                this.timeout(8000);

                let options = Util.create_options({beacon_skill: {enter: "survey", leave: "bye"}});
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, {
                            "hwid": "d41d8cd98f",
                            "type": "enter"
                        }));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", "satisfaction");
                        response.should.have.property("to_confirm").have.lengthOf(4);
                        response.to_confirm[0].should.equal("satisfaction");
                        response.to_confirm[1].should.equal("difficulty");
                        response.to_confirm[2].should.equal("free_comment");
                        response.to_confirm[3].should.equal("mail");
                        response.previous.confirmed.should.deep.equal([]);
                    }
                );
            });
        });
        describe("beacon leave event", function(){
            it("should be processed successfully using bye skill.", function(){
                this.timeout(8000);

                let options = Util.create_options({beacon_skill: {enter: "survey", leave: "bye"}});
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, {
                            "hwid": "d41d8cd98f",
                            "type": "leave"
                        }));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", null);
                        response.should.have.property("to_confirm").and.deep.equal([]);
                        response.previous.confirmed.should.deep.equal([]);
                    }
                );
            });
        });
    });
}
