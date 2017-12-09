'use strict';

const message_platform_list = ["line"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

for (let message_platform of message_platform_list){
    describe("BTW FLOW TEST - from " + message_platform, function(){
        let user_id = "reply-flow";
        let event_type = "message";
        describe("User restarts conversation.", function(){
            it("will trigger restart_conversation.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色をかえたい"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what color user like to change to.
                        response.should.have.property("confirming").and.deep.equal("color");
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "赤"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value and conversation completed.
                        response.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});

                        // Restart Conversation
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色をかえたい"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what color user like to change to.
                        response.should.have.property("_flow").and.equal("btw");
                        response.should.have.property("confirming").and.deep.equal("color");
                    }
                );
            });
        });

        describe("User changes intent.", function(){
            it("will trigger change intent.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色をかえたい"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what color user like to change to.
                        response.should.have.property("confirming").and.deep.equal("color");
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "赤"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value and conversation completed.
                        response.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});

                        // Change Intent
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ピザを注文したい"));
                    }
                ).then(
                    function(response){
                        // Bot is asking pizza type while keeping parameter.
                        response.should.have.property("_flow").and.equal("btw");
                        response.should.have.property("confirming").and.deep.equal("pizza");
                        response.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});
                    }
                );
            });
        });

        describe("User changes parameter.", function(){
            it("will trigger change parameter.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色をかえたい"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what color user like to change to.
                        response.should.have.property("confirming").and.deep.equal("color");
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "赤"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value and conversation completed.
                        response.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});

                        // Change parameter
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "青"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value.
                        response.should.have.property("_flow").and.equal("btw");
                        response.should.have.property("confirmed").and.deep.equal({color: "5068FF"});
                    }
                );
            });
        });

        describe("User says something but bot cannot understand.", function(){
            it("will trigger default skill.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色をかえたい"));
                    }
                ).then(
                    function(response){
                        // Bot is asking what color user like to change to.
                        response.should.have.property("confirming").and.deep.equal("color");
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "赤"));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the value and conversation completed.
                        response.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});

                        // User says something unknown.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ほげほげ"));
                    }
                ).then(
                    function(response){
                        // Bot replied using default skill while keeping parameter.
                        response.should.have.property("_flow").and.equal("btw");
                        response.intent.name.should.equal("input.unknown");
                        response.should.have.property("confirmed").and.deep.equal({color: "FF7B7B"});
                    }
                );
            });
        });
    });
}
