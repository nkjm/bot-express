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
    describe("# No corresponding parameter found", function(){
        it("will skip the parameter.", function(){
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
                    response.should.have.property("confirming", "zip_code");
                    response.confirmed.should.deep.equal({});
                    response.to_confirm.should.have.lengthOf(3);
                    response.to_confirm[0].name.should.equal("zip_code");
                    response.to_confirm[1].name.should.equal("city");
                    response.to_confirm[2].name.should.equal("street");
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
                    // Bot is now asking zip_code.
                    response.should.have.property("confirming", "zip_code");
                    response.confirmed.should.deep.equal({});
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "107-0061"));
                }
            ).then(
                function(response){
                    // Bot should have set zip_code.
                    response.should.have.property("confirming", "city");
                    response.confirmed.should.deep.equal({
                        zip_code: {
                            zip_code: "107-0061",
                            resolved_address: "東京都港区北青山"
                        }
                    });
                }
            )
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
                    // Bot is now asking zip_code.
                    response.should.have.property("confirming", "zip_code");
                    response.confirmed.should.deep.equal({});
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "000-0000"));
                }
            ).then(
                function(response){
                    // Bot should ask the same question once again.
                    response.should.have.property("confirming", "zip_code");
                    response.confirmed.should.deep.equal({});
                }
            )
        });
    });
    describe("# There is corresponding parameter but no parser found", function(){
        it("will apply the value as it is unless the value is empty.", function(){
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
                    response.should.have.property("confirming", "zip_code");
                    response.confirmed.should.deep.equal({});
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "107-0061"));
                }
            ).then(
                function(response){
                    // Bot should have set zip_code.
                    response.should.have.property("confirming", "city");
                    response.confirmed.should.deep.equal({
                        zip_code: {
                            zip_code: "107-0061",
                            resolved_address: "東京都港区北青山"
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, "東京都港区北青山"));
                }
            ).then(
                function(response){
                    // Bot should have set city.
                    response.should.have.property("confirming", "street");
                    response.confirmed.should.deep.equal({
                        zip_code: {
                            zip_code: "107-0061",
                            resolved_address: "東京都港区北青山"
                        },
                        city: "東京都港区北青山"
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "2-5-8"));
                }
            ).then(
                function(response){
                    // Bot should have set street.
                    response.should.have.property("confirming", null);
                    response.confirmed.should.deep.equal({
                        zip_code: {
                            zip_code: "107-0061",
                            resolved_address: "東京都港区北青山"
                        },
                        city: "東京都港区北青山",
                        street: "2-5-8"
                    });
                }
            )
        });
    });
    describe("# There is corresponding parameter and parser. If parser throws exception,", function(){
        it("stops processing.", function(){
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
                    response.should.have.property("confirming", "zip_code");
                    response.confirmed.should.deep.equal({});
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "107-0061"));
                }
            ).then(
                function(response){
                    // Bot should have set zip_code.
                    response.should.have.property("confirming", "city");
                    response.confirmed.should.deep.equal({
                        zip_code: {
                            zip_code: "107-0061",
                            resolved_address: "東京都港区北青山"
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "例外"));
                }
            ).catch(
                function(response){
                    // Bot should stops processing and returns Error Object
                    response.should.have.property("name", "Error");
                    response.should.have.property("message", "例外");
                }
            );
        });
    });
});
