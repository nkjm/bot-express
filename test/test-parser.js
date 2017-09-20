'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();


describe("Parser Test", function(){
    let message_platform = "facebook";
    let user_id = "parse";
    describe("# NLP return some params but no corresponding parameter found in skill", function(){
        it("will skip that parameter.", function(){
            this.timeout(5000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "パーステスト"));
                }
            ).then(
                function(response){
                    // Bot is now asking zip_code.
                    response.should.have.property("confirming", "type");
                    response.confirmed.should.deep.equal({});
                }
            )
        });
    });
    describe("# There is corresponding parameter and parser. If parse succeeds,", function(){
        it("will apply the value.", function(){
            this.timeout(5000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "パーステスト"));
                }
            ).then(
                function(response){
                    // Bot is now asking juminhyo type.
                    response.should.have.property("confirming", "type");
                    response.confirmed.should.deep.equal({});
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "世帯全員分"));
                }
            ).then(
                function(response){
                    // Bot should have set zip_code.
                    response.confirmed.should.have.property("type", "世帯全員分");
                }
            );
        });
    });
    describe("# There is corresponding parameter and parser. If parse fails,", function(){
        it("does not apply the value and ask samke question once again.", function(){
            this.timeout(5000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "パーステスト"));
                }
            ).then(
                function(response){
                    // Bot is now asking juminhyo type.
                    response.should.have.property("confirming", "type");
                    response.confirmed.should.deep.equal({});
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "他人の分"));
                }
            ).then(
                function(response){
                    // Bot should ask for same parameter onece again.
                    response.should.have.property("confirming", "type");
                    response.confirmed.should.deep.equal({});
                }
            );
        });
    });
    describe("# There is corresponding parameter but no parser found", function(){
        it("will apply the value as it is unless the value is empty.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "パーステスト"));
                }
            ).then(
                function(response){
                    // Bot is now asking juminhyo type
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "本人だけ"));
                }
            ).then(
                function(response){
                    // Bot is now asking name.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "中嶋一樹です"));
                }
            ).then(
                function(response){
                    // Bot is now confirming if name is correct.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "いいえ"));
                }
            ).then(
                function(response){
                    // Bot is now asking lastname
                    response.should.have.property("confirming", "lastname");
                    response.to_confirm[0].should.equal("lastname");

                    return webhook.run(Util.create_req(message_platform, "message", user_id, "中嶋"));
                }
            ).then(
                function(response){
                    // Bot is now asking firstname and lastname should be in confirmed.
                    response.confirmed.should.have.property("lastname", "中嶋");
                }
            );
        });
    });
});
