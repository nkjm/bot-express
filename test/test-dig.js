'use strict';

const message_platform_list = ["line"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

for (let message_platform of message_platform_list){
    describe("dig test - from " + message_platform, function(){
        let user_id = "dig";
        let event_type = "message";
        describe("Ask supported color when user is asked for what color likes to change to.", function(){
            it("switches intent to answer-available-color and get back.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色変えて"));
                    }
                ).then(
                    function(response){
                        // Now bot is asking what color you like.
                        response.should.have.property("confirming", "color");

                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "何色にできるの"));
                    }
                ).then(
                    function(response){
                        // Now bot answers supported colors.
                        response.previous.message[0].message.text.should.equal("利用できるライトの色は青、赤、黄でございます。");

                        // Context get back to change-light color.
                        response.intent.name.should.equal("change-light-color");
                        response.should.have.property("confirming", "color");

                        return webhook.run(Util.create_req(message_platform, event_type, user_id, "青"));
                    }
                ).then(
                    function(response){
                        // Now bot changed color.
                        response.previous.message[0].message.text.should.equal("了解しましたー。");
                    }
                );
            });
        });
    });
}
