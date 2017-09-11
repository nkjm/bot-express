'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
let should = chai.should();


describe("DATETIMEPICKER TEST - from LINE", function(){
    const user_id = "datetimepicker";
    const message_platform = "line";
    describe("Buttons Template which includes just 1 button which is datetimepicker", function(){
        it("will be processed and selected date should be saved in confirmed.", function(){
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
                    // Bot is what test case to perform.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "buttons_date_only"));
                }
            ).then(
                function(response){
                    // Bot is asking date.
                    response.previous.message[0].message.should.have.property("template").and.deep.equal({
                        type: "buttons",
                        text: "日にちを教えてください",
                        actions: [
                            {type: "datetimepicker", label: "日にちを選択", mode: "date", data: "dummy"}
                        ]
                    });

                    let postback_body = {
                        data: "dummy",
                        params: {
                            date: "2017-09-08"
                        }
                    }
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, postback_body));
                }
            ).then(
                function(response){
                    // Bot has accepted the date.
                    response.confirmed.should.have.property("buttons_date_only").and.equal("2017-09-08");
                }
            );
        });
    });

    describe("Buttons Template which includes 2 buttons which is url and datetimepicker", function(){
        it("will be processed and selected date should be saved in confirmed.", function(){
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
                    // Bot is what test case to perform.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "buttons_date_and_url"));
                }
            ).then(
                function(response){
                    // Bot is asking date.
                    response.previous.message[0].message.should.have.property("template").and.deep.equal({
                        type: "buttons",
                        text: "日にちを教えてください",
                        actions: [
                            {type: "uri", label: "詳細を見る", uri: "https://www.linecorp.com"},
                            {type: "datetimepicker", label: "日にちを選択", mode: "date", data: "dummy"}
                        ]
                    });

                    let postback_body = {
                        data: "dummy",
                        params: {
                            date: "2017-09-08"
                        }
                    }
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, postback_body));
                }
            ).then(
                function(response){
                    // Bot has accepted the date.
                    response.confirmed.should.have.property("buttons_date_and_url").and.equal("2017-09-08");
                }
            );
        });
    });
});

describe("DATETIMEPICKER TEST - from Facebook", function(){
    const user_id = "datetimepicker";
    const message_platform = "facebook";
    describe("Buttons Template which includes just 1 button which is datetimepicker", function(){
        it("will be plane text message asking date.", function(){
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
                    // Bot is what test case to perform.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "buttons_date_only"));
                }
            ).then(
                function(response){
                    // Bot sent plane text message asking date.
                    response.previous.message[0].message.should.have.property("text").and.equal("日にちを教えてください");

                    return webhook.run(Util.create_req(message_platform, "message", user_id, "2017-09-08"));
                }
            ).then(
                function(response){
                    // Bot has accepted the date.
                    response.confirmed.should.have.property("buttons_date_only").and.equal("2017-09-08");
                }
            );
        });
    });

    describe("Buttons Template which includes 2 buttons which is url and datetimepicker", function(){
        it("will remove datetimepicker button.", function(){
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
                    // Bot is what test case to perform.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "buttons_date_and_url"));
                }
            ).then(
                function(response){
                    // Bot is asking date.
                    response.previous.message[0].message.should.have.property("attachment").and.deep.equal({
                        type: "template",
                        payload: {
                            template_type: "button",
                            text: "日にちを教えてください",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.linecorp.com",
                                title: "詳細を見る"
                            }]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "2017-09-08"));
                }
            ).then(
                function(response){
                    // Bot has accepted the date.
                    response.confirmed.should.have.property("buttons_date_and_url").and.equal("2017-09-08");
                }
            );
        });
    });

    describe("Carousel Template which includes only 1 button which is datetimepicker", function(){
        it("will send plane text message saying we can't compile it.", function(){
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
                    // Bot is what test case to perform.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "carousel_date_only"));
                }
            ).then(
                function(response){
                    // Bot is asking date.
                    response.previous.message[0].message.should.have.property("text").and.equal("日にちを教えてください *Compiling template message including just 1 button which is datetimepicker is not supported.");
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "2017-09-08"));
                }
            ).then(
                function(response){
                    // Bot has accepted the date.
                    response.confirmed.should.have.property("carousel_date_only").and.equal("2017-09-08");
                }
            );
        });
    });

    describe("Carousel Template which includes 2 buttons which is url and datetimepicker", function(){
        it("will remove datetimepicker button.", function(){
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
                    // Bot is what test case to perform.
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "carousel_date_and_url"));
                }
            ).then(
                function(response){
                    // Bot is asking date.
                    response.previous.message[0].message.should.have.property("attachment").and.deep.equal({
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [{
                                title: "日にちを選択してください",
                                image_url: undefined,
                                buttons: [{
                                    type: "web_url",
                                    url: "https://www.linecorp.com",
                                    title: "詳細を見る"
                                }]
                            }]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "2017-09-08"));
                }
            ).then(
                function(response){
                    // Bot has accepted the date.
                    response.confirmed.should.have.property("carousel_date_and_url").and.equal("2017-09-08");
                }
            );
        });
    });
});
