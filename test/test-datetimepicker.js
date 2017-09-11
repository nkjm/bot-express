'use strict';

const message_platform_list = ["line"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

for (let message_platform of message_platform_list){
    describe("DATETIMEPICKER TEST - from " + message_platform, function(){
        let user_id = "datetimepicker";
        describe("User select value in datetime picker", function(){
            it("will be accepted and fires reaction.", function(){
                this.timeout(8000);

                let options = Util.create_options();
                options.auto_translation = "disabled";
                let webhook = new Webhook(options);
                return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                    function(response){
                        // User starts conversation.
                        return webhook.run(Util.create_req(message_platform, "message", user_id, "test datetimepicker"));
                    }
                ).then(
                    function(response){
                        // Bot is asking date.
                        let postback_body = {
                            data: "",
                            params: {
                                date: "2017-09-08"
                            }
                        }
                        return webhook.run(Util.create_req(message_platform, "postback", user_id, postback_body));
                    }
                ).then(
                    function(response){
                        // Bot has accepted the date.
                        response.should.have.property("confirmed").and.deep.equal({date: "2017-09-08"});
                    }
                );
            });
        });
    });
}
