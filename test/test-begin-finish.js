'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe("begin finish test from LINE", function(){
    let user_id = "begin-finish";
    let event_type = "message";
    let message_platform = "line";

    describe("Start Conversation", function(){
        it("should run through begin, required_param and finish.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            options.auto_translation = "disabled";
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "test-begin-finish"));
                }
            ).then(
                function(response){
                    // Bot saying welcome message followed by asking name.
                    response.previous.message[1].message.text.should.equal("ようこそ私を召喚くださいました。");
                    response.previous.message[0].message.text.should.equal("お名前を教えてください。");
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "中嶋一樹"));
                }
            ).then(
                function(response){
                    // Bot saying welcome message followed by asking name.
                    response.previous.message[0].message.text.should.equal("中嶋一樹さん、さようなら。");
                }
            );
        });
    });

    describe("Change Intent", function(){
        it("should run through begin, required_param and finish.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            options.auto_translation = "disabled";
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "住民票を申請したい"));
                }
            ).then(
                function(response){
                    // Bot applied juminhyo skill and asking juminhyo type.
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "test-begin-finish"));
                }
            ).then(
                function(response){
                    // Bot saying welcome message followed by asking name.
                    response.previous.message[1].message.text.should.equal("ようこそ私を召喚くださいました。");
                    response.previous.message[0].message.text.should.equal("お名前を教えてください。");
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "中嶋一樹"));
                }
            ).then(
                function(response){
                    // Bot saying welcome message followed by asking name.
                    response.previous.message[0].message.text.should.equal("中嶋一樹さん、さようなら。");
                }
            );
        });
    });

    describe("BTW", function(){
        it("should run through begin, required_param and finish.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            options.auto_translation = "disabled";
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "ライトの色を変更して"));
                }
            ).then(
                function(response){
                    // Bot applied change light color skill and asking color.
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "赤"));
                }
            ).then(
                function(response){
                    // Bot complte change light color skill and still maintain the context.
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "test-begin-finish"));
                }
            ).then(
                function(response){
                    // Bot goes BTW flow and saying welcome message followed by asking name.
                    response._flow.should.equal("btw");
                    response.previous.message[1].message.text.should.equal("ようこそ私を召喚くださいました。");
                    response.previous.message[0].message.text.should.equal("お名前を教えてください。");
                    return webhook.run(Util.create_req(message_platform, event_type, user_id, "中嶋一樹"));
                }
            ).then(
                function(response){
                    // Bot saying welcome message followed by asking name.
                    response.previous.message[0].message.text.should.equal("中嶋一樹さん、さようなら。");
                }
            );
        });
    });
});
