'use strict';

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();


describe("Collect Test", function(){
    let message_platform = "line";
    let user_id = "collect";

    describe("collect by collect_by_parameter_key", function(){
        it("will successfully collect optional parameter.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "住民票を申請したい"));
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

    describe("collect by collect_by_parameter_name", function(){
        it("will successfully add new param to skill.dynamic_parameter and to_confirm.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "住民票を申請したい"));
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
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "はい"));
                }
            ).then(
                function(response){
                    // Bot is now asking zip code.
                    response.should.have.property("confirming", "zip_code");
                }
            );
        });
    });

    describe("collect existing parameter by collect_by_parameter_key", function(){
        it("will successfully add modify param of skill.required_parameter and add it to_confirm.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "住民票を申請したい"));
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
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "はい"));
                }
            ).then(
                function(response){
                    // Bot is now asking zip code.
                    response.previous.message[0].message.text.should.equal("郵便番号を教えていただけますか？");
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "107-0061"));
                }
            ).then(
                function(response){
                    // Bot is now asking if city is correct.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "いいえ"));
                }
            ).then(
                function(response){
                    // Bot is now asking zip code once again.
                    response.previous.message[0].message.text.should.equal("なんと。もう一度郵便番号うかがってもいいですか？");
                }
            );
        });
    });
});
