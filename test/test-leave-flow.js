'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();

describe("leave flow test from LINE", function(){
    let user_id = "leave-flow";
    let event_type = "leave";
    let messenger_type = "line";

    describe("leave skill not found", function(){
        it("should just skip this event.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(messenger_type, event_type, user_id, null));
                }
            ).then(
                function(response){
                    should.not.exist(response);
                }
            );
        });
    });
    describe("leave skill found", function(){
        it("should invoke join skill.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            options.leave_skill = "test-unfollow";

            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(messenger_type, event_type, user_id, null));
                }
            ).then(
                function(response){
                    response.previous.message.should.have.lengthOf(2);
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "text",
                        text: "Bye."
                    });
                }
            );
        });
    });
});
