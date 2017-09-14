'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

for (let message_platform of message_platform_list){
    describe("survey skill test - from " + message_platform, function(){
        let user_id = "survey";
        let event_type = "message";
        describe("#Normal input", function(){
            it("triggers start conversation flow and completes after answering to a couple of questions.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "アンケートテスト"));
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
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "5"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({satisfaction: 5});
                        response.should.have.property("confirming", "difficulty");
                        response.should.have.property("to_confirm").have.lengthOf(3);
                        response.to_confirm[0].should.equal("difficulty");
                        response.to_confirm[1].should.equal("free_comment");
                        response.to_confirm[2].should.equal("mail");
                        response.previous.confirmed.should.deep.equal(["satisfaction"]);
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "難しい"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({
                            satisfaction: 5,
                            difficulty: 1
                        });
                        response.should.have.property("confirming", "free_comment");
                        response.should.have.property("to_confirm").have.lengthOf(2);
                        response.to_confirm[0].should.equal("free_comment");
                        response.to_confirm[1].should.equal("mail");
                        response.previous.confirmed.should.deep.equal(["difficulty","satisfaction"]);
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "とても有意義でした。"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({
                            satisfaction: 5,
                            difficulty: 1,
                            free_comment: "とても有意義でした。"
                        });
                        response.should.have.property("confirming", "mail");
                        response.should.have.property("to_confirm").have.lengthOf(1);
                        response.to_confirm[0].should.equal("mail");
                        response.previous.confirmed.should.deep.equal(["free_comment","difficulty","satisfaction"]);
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "nakajima@hoge.com"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({
                            satisfaction: 5,
                            difficulty: 1,
                            free_comment: "とても有意義でした。",
                            mail: "nakajima@hoge.com"
                        });
                        response.should.have.property("confirming", null);
                        response.should.have.property("to_confirm").and.deep.equal([]);
                        response.previous.confirmed.should.deep.equal(["mail","free_comment","difficulty","satisfaction"]);
                    }
                );
            });
        });
        describe("#Illegal input for satisfaction", function(){
            it("will be rejected by parse method and be asked same question.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "アンケートテスト"));
                    }
                ).then(
                    function(response){
                        // Bot is asking satisfaction.
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", "satisfaction");
                        response.should.have.property("to_confirm").have.lengthOf(4);
                        response.to_confirm[0].should.equal("satisfaction");
                        response.to_confirm[1].should.equal("difficulty");
                        response.to_confirm[2].should.equal("free_comment");
                        response.to_confirm[3].should.equal("mail");
                        response.previous.confirmed.should.deep.equal([]);
                        // Answer the value which is out of range.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "6"));
                    }
                ).then(
                    function(response){
                        // Bot is asking satisfaction.
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", "satisfaction");
                        response.should.have.property("to_confirm").have.lengthOf(4);
                        response.to_confirm[0].should.equal("satisfaction");
                        response.to_confirm[1].should.equal("difficulty");
                        response.to_confirm[2].should.equal("free_comment");
                        response.to_confirm[3].should.equal("mail");
                        response.previous.confirmed.should.deep.equal([]);
                        // Answer the value of unacceptable data type.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "良い"));
                    }
                ).then(
                    function(response){
                        // Bot is asking satisfaction.
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
        describe("#Acceptable zenkaku input for satisfaction", function(){
            it("will be converted to hankaku.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "アンケートテスト"));
                    }
                ).then(
                    function(response){
                        // Bot says "Please tell me satisfaction score.".
                        response.should.have.property("confirmed").and.deep.equal({});
                        response.should.have.property("confirming", "satisfaction");
                        response.should.have.property("to_confirm").have.lengthOf(4);
                        response.to_confirm[0].should.equal("satisfaction");
                        response.to_confirm[1].should.equal("difficulty");
                        response.to_confirm[2].should.equal("free_comment");
                        response.to_confirm[3].should.equal("mail");
                        response.previous.confirmed.should.deep.equal([]);
                        // Answer the value which is out of range.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "５"));
                    }
                ).then(
                    function(response){
                        response.should.have.property("confirmed").and.deep.equal({satisfaction: 5});
                        response.should.have.property("confirming", "difficulty");
                        response.should.have.property("to_confirm").have.lengthOf(3);
                        response.to_confirm[0].should.equal("difficulty");
                        response.to_confirm[1].should.equal("free_comment");
                        response.to_confirm[2].should.equal("mail");
                        response.previous.confirmed.should.deep.equal(["satisfaction"]);
                    }
                );
            });
        });
        describe("#Acceptable text for difficulty", function(){
            it("will be accepted and converted to corresponding value.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "アンケートテスト"));
                    }
                ).then(
                    function(response){
                        // Bot is asking satisfaction.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "5"));
                    }
                ).then(
                    function(response){
                        // Bot is asking difficulty.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "激ムズでした。"));
                    }
                ).then(
                    function(response){
                        // Bot is asking difficulty.
                        response.should.have.property("confirmed").and.deep.equal({
                            satisfaction: 5,
                            difficulty: 1
                        });
                    }
                );
            });
        });
        describe("#Illegal email", function(){
            it("will be rejected and be asked same question once again.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "アンケートテスト"));
                    }
                ).then(
                    function(response){
                        // Bot is asking satisfaction.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "5"));
                    }
                ).then(
                    function(response){
                        // Bot is asking difficulty.
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "激ムズでした。"));
                    }
                ).then(
                    function(response){
                        // Bot is asking free_comment
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "特になし"));
                    }
                ).then(
                    function(response){
                        // Bot is asking mail
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "nakajima.hoge.com"));
                    }
                ).then(
                    function(response){
                        // Bot is still asking mail
                        response.should.have.property("confirming").and.equal("mail");
                    }
                );
            });
        });
    });
}
