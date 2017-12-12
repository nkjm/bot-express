"use strict";

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Webhook = require('../module/webhook');
const Util = require("../test_utility/test_utility");
const debug = require("debug")("bot-express:test");

chai.use(chaiAsPromised);
let should = chai.should();

describe("Push flow test from LINE", function(){
    let user_id = "push-flow";
    let messenger = "line";

    describe("bot recieved bot-express:push event", function(){
        it("should trigger collecting parameters based on the skill.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            let event = {
                type: "bot-express:push",
                to: {
                    type: "user",
                    userId: user_id
                },
                intent: {
                    name: "test-push-flow"
                }
            }

            return webhook.run(Util.create_req_to_clear_memory(user_id)).then(
                function(response){
                    return webhook.run(Util.create_req_with_event(messenger, event));
                }
            ).then(
                function(response){
                    response._flow.should.equal("push");
                    response.confirming.should.equal("diet_type");
                    response.previous.message[0].from.should.equal("bot");
                    return webhook.run(Util.create_req(messenger, "message", user_id, "dinner"));
                }
            ).then(
                function(response){
                    response._flow.should.equal("reply");
                    response.confirmed.diet_type = "dinner";
                    response.confirming.should.equal("diet");
                }
            );
        });
    });

    describe("bot recieved bot-express:push event which contains parameters.", function(){
        it("should trigger collecting remaining parameters based on the skill.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            let event = {
                type: "bot-express:push",
                to: {
                    type: "user",
                    userId: user_id
                },
                intent: {
                    name: "test-push-flow",
                    parameters: {
                        diet_type: "lunch"
                    }
                }
            }

            return webhook.run(Util.create_req_to_clear_memory(user_id)).then(
                function(response){
                    return webhook.run(Util.create_req_with_event(messenger, event));
                }
            ).then(
                function(response){
                    response._flow.should.equal("push");
                    response.confirming.should.equal("diet");
                    response.previous.message[0].from.should.equal("bot");
                    return webhook.run(Util.create_req(messenger, "message", user_id, "yakiniku"));
                }
            ).then(
                function(response){
                    response._flow.should.equal("reply");
                    response.confirmed.diet_type = "lunch";
                    response.confirmed.diet = "yakiniku";
                }
            );
        });
    });
});
