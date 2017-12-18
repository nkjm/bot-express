'use strict';

const message_platform_list = ["line"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

for (let message_platform of message_platform_list){
    describe("START CONVERSATION FLOW TEST - from " + message_platform, function(){
        let user_id = "start-conversation-flow";
        let event_type = "message";

        describe("Received unsupported event", function(){
            it("should be skipped", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, "unsupported", user_id, null));
                    }
                ).then(
                    function(response){
                        response._flow.should.equal("start_conversation");
                        response.should.have.property("intent").and.equal(null);
                    }
                );
            });
        });

        describe("User says identifiable request", function(){
            it("should trigger start conversation flow and pick up suitable skill", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したいのですが"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("start_conversation");
                        response.intent.name.should.equal("handle-pizza-order");
                        response.to_confirm.should.have.lengthOf(4);
                        response.confirming.should.equal("pizza");
                        response.confirmed.should.deep.equal({});
                    }
                );
            });
        });

        describe("User says identifiable request including parameters.", function(){
            it("should trigger start conversation flow and set parameters.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "マルゲリータのLサイズをお願いしたいのですが"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("start_conversation");
                        response.intent.name.should.equal("handle-pizza-order");
                        response.to_confirm.should.have.lengthOf(2);
                        response.confirming.should.equal("address");
                        response.confirmed.should.deep.equal({
                            pizza: "マルゲリータ",
                            size: "L"
                        });
                    }
                );
            });
        });

        describe("User says unknown request.", function(){
            it("should trigger start conversation flow and set parameters.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ほげほげ"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("_flow").and.equal("start_conversation");
                        response.intent.name.should.equal("input.unknown");
                    }
                );
            });
        });

        describe("Recieved postback which contains intent object.", function(){
            it("should trigger start conversation flow and set specified intent.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                let event = {
                    type: "postback",
                    timestamp: "1462629479859",
                    source: {
                        type: "user",
                        userId: user_id
                    },
                    postback: {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "handle-pizza-order"
                            }
                        })
                    }
                }
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req_with_event(message_platform, event));
                    }
                ).then(
                    function(response){
                        response._flow.should.equal("start_conversation");
                        response.intent.name.should.equal("handle-pizza-order");
                        response.confirming.should.equal("pizza");
                    }
                );
            });
        });

        describe("Recieved postback which contains intent object with parameters.", function(){
            it("should trigger start conversation flow and set specified intent and parameters.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                let event = {
                    type: "postback",
                    timestamp: "1462629479859",
                    source: {
                        type: "user",
                        userId: user_id
                    },
                    postback: {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "handle-pizza-order",
                                parameters: {
                                    pizza: "マリナーラ"
                                }
                            }
                        })
                    }
                }
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req_with_event(message_platform, event));
                    }
                ).then(
                    function(response){
                        response._flow.should.equal("start_conversation");
                        response.intent.name.should.equal("handle-pizza-order");
                        response.confirming.should.equal("size");
                    }
                );
            });
        });
    });
}
