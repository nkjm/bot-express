"use strict";

const message_platform_list = ["line", "facebook"];

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Webhook = require('../module/webhook');
let Util = require("../test_utility/test_utility");

chai.use(chaiAsPromised);
chai.should();

describe("compile-message-test - from line", function(){
    let message_platform = "line";
    let user_id = "compile-message-test";
    describe("コンパイルメッセージテスト", function(){
        it("start asking pizza type in various format.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "コンパイルメッセージテスト"));
                }
            ).then(
                function(response){
                    // Bot sent text message.
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "text",
                        text: "ご注文のピザは？"
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent template button postback.
                    response.should.have.property("confirmed").and.deep.equal({line_text: "マルゲリータ"});
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "ご注文のピザをお選びください。",
                        template: {
                            type: "buttons",
                            text: "ご注文のピザをお選びください。",
                            actions: [
                                {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                                {type:"postback",label:"マリナーラ",data:"マリナーラ"},
                                {type:"postback",label:"カプリチョーザ",data:"カプリチョーザ"},
                                {type:"postback",label:"クワトロフォルマッジ",data:"クワトロフォルマッジ"}
                            ]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {data:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template button message.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "ご注文のピザをお選びください。",
                        template: {
                            type: "buttons",
                            text: "ご注文のピザをお選びください。",
                            actions: [
                                {type:"message",label:"マルゲリータ",text:"マルゲリータ"},
                                {type:"message",label:"マリナーラ",text:"マリナーラ"},
                                {type:"message",label:"カプリチョーザ",text:"カプリチョーザ"},
                                {type:"message",label:"クワトロフォルマッジ",text:"クワトロフォルマッジ"}
                            ]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent template button uri.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "ご注文のピザをお選びください。",
                        template: {
                            type: "buttons",
                            text: "ご注文のピザをお選びください。",
                            actions: [
                                {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                                {type:"postback",label:"マリナーラ",data:"マリナーラ"},
                                {type:"uri", label: "すべてのメニュー", uri:"https://www.dominos.jp/order/pizza/search/"}
                            ]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {data:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template button uri more than 3.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "ご注文のピザをお選びください。",
                        template: {
                            type: "buttons",
                            text: "ご注文のピザをお選びください。",
                            actions: [
                                {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                                {type:"postback",label:"マリナーラ",data:"マリナーラ"},
                                {type:"postback",label:"カプリチョーザ",data:"カプリチョーザ"},
                                {type:"uri", label: "すべてのメニュー", uri:"https://www.dominos.jp/order/pizza/search/"}
                            ]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {data:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template confirm.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "ご注文は以上ですか？",
                        template: {
                            type: "confirm",
                            text: "ご注文は以上ですか？",
                            actions: [
                                {type:"message",label:"はい",text:"はい"},
                                {type:"message",label:"いいえ",text:"いいえ"}
                            ]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "はい"));
                }
            ).then(
                function(response){
                    // Bot sent template carousel.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "Carousel Template",
                        template: {
                            type: "carousel",
                            columns: [{
                                thumbnailImageUrl: "https://www.dominos.jp/common/img/itemimgsx/90.jpg?_=12016",
                                text: "マルゲリータ",
                                actions: [
                                    {type:"postback", label:"注文する", data:"マルゲリータ"},
                                    {type:"uri", label:"詳細", uri:"https://www.dominos.jp/order/pizza/detail/99999/19001/90"}
                                ]
                            },{
                                thumbnailImageUrl: "https://www.dominos.jp/common/img/itemimgsx/216.jpg?_=12016",
                                text: "ジェノベーゼ",
                                actions: [
                                    {type:"postback", label:"注文する", data:"ジェノベーゼ"},
                                    {type:"uri", label:"詳細", uri:"https://www.dominos.jp/order/pizza/detail/99999/19001/216"}
                                ]
                            }]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {data:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent text message.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "text",
                        text: "ご注文のピザは？"
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent template button message.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "ご注文のピザをお選びください。",
                        template: {
                            type: "buttons",
                            text: "ご注文のピザをお選びください。",
                            actions: [
                                {type:"message",label:"マルゲリータ",text:"マルゲリータ"},
                                {type:"message",label:"マリナーラ",text:"マリナーラ"}
                            ]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent text message while original message object is quick reply.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "text",
                        text: "ご注文のピザをお選びください。"
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent template button postback
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ",
                        facebook_quick_reply_more_than_4: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "ご注文のピザをお選びください。",
                        template: {
                            type: "buttons",
                            text: "ご注文のピザをお選びください。",
                            actions: [
                                {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                                {type:"postback",label:"マリナーラ",data:"マリナーラ"}
                            ]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {data:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template button postback and uri
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ",
                        facebook_quick_reply_more_than_4: "マルゲリータ",
                        facebook_template_button_postback: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "ご注文のピザをお選びください。",
                        template: {
                            type: "buttons",
                            text: "ご注文のピザをお選びください。",
                            actions: [
                                {type:"postback",label:"マルゲリータ",data:"マルゲリータ"},
                                {type:"postback",label:"マリナーラ",data:"マリナーラ"},
                                {type:"uri", label: "すべてのメニュー", uri:"https://www.dominos.jp/order/pizza/search/"}
                            ]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {data:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template carousel
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ",
                        facebook_quick_reply_more_than_4: "マルゲリータ",
                        facebook_template_button_postback: "マルゲリータ",
                        facebook_template_button_web_url: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "template",
                        altText: "Carousel Template",
                        template: {
                            type: "carousel",
                            columns: [{
                                thumbnailImageUrl: "https://www.dominos.jp/common/img/itemimgsx/90.jpg?_=12016",
                                text: "マルゲリータ",
                                actions: [
                                    {type:"postback", label:"注文する", data:"マルゲリータ"},
                                    {type:"uri", label:"詳細", uri:"https://www.dominos.jp/order/pizza/detail/99999/19001/90"}
                                ]
                            },{
                                thumbnailImageUrl: "https://www.dominos.jp/common/img/itemimgsx/216.jpg?_=12016",
                                text: "ジェノベーゼ",
                                actions: [
                                    {type:"postback", label:"注文する", data:"ジェノベーゼ"},
                                    {type:"uri", label:"詳細", uri:"https://www.dominos.jp/order/pizza/detail/99999/19001/216"}
                                ]
                            }]
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {data:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template carousel
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ",
                        facebook_quick_reply_more_than_4: "マルゲリータ",
                        facebook_template_button_postback: "マルゲリータ",
                        facebook_template_button_web_url: "マルゲリータ",
                        facebook_template_generic: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        type: "text",
                        text: "完了"
                    });
                }
            )
        });
    });
});

describe("compile-message-test - from facebook", function(){
    let message_platform = "facebook";
    let user_id = "compile-message-test";
    describe("コンパイルメッセージテスト", function(){
        it("start asking pizza type in various format.", function(){
            this.timeout(8000);

            let options = Util.create_options();
            let webhook = new Webhook(options);
            return webhook.run(Util["create_req_to_clear_memory"](user_id)).then(
                function(response){
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "コンパイルメッセージテスト"));
                }
            ).then(
                function(response){
                    // Bot sent text message.
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ご注文のピザは？"
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent quick reply message.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ご注文のピザをお選びください。",
                        quick_replies: [
                            {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                            {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                            {content_type:"text",title:"カプリチョーザ",payload:"カプリチョーザ"},
                            {content_type:"text",title:"クワトロフォルマッジ",payload:"クワトロフォルマッジ"}
                        ]
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {payload:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent quick reply
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ご注文のピザをお選びください。",
                        quick_replies: [
                            {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                            {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                            {content_type:"text",title:"カプリチョーザ",payload:"カプリチョーザ"},
                            {content_type:"text",title:"クワトロフォルマッジ",payload:"クワトロフォルマッジ"}
                        ]
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent template button uri.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "button",
                                text: "ご注文のピザをお選びください。",
                                buttons: [
                                    {type: "postback", title: "マルゲリータ", payload: "マルゲリータ"},
                                    {type: "postback", title: "マリナーラ", payload: "マリナーラ"},
                                    {type: "web_url", title: "すべてのメニュー", url: "https://www.dominos.jp/order/pizza/search/"}
                                ]
                            }
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {payload:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot tried to compile template button uri more than 3 but could not. So sent text message.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ご注文のピザをお選びください。 *Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message."
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent quick reply
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ご注文は以上ですか？",
                        quick_replies: [
                            {content_type:"text",title:"はい",payload:"はい"},
                            {content_type:"text",title:"いいえ",payload:"いいえ"},
                        ]
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "はい"));
                }
            ).then(
                function(response){
                    // Bot sent template generic
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: [{
                                    title: "マルゲリータ",
                                    image_url: "https://www.dominos.jp/common/img/itemimgsx/90.jpg?_=12016",
                                    buttons: [
                                        {type: "postback", title: "注文する", payload: "マルゲリータ"},
                                        {type: "web_url", title: "詳細", url: "https://www.dominos.jp/order/pizza/detail/99999/19001/90"}
                                    ]
                                },{
                                    title: "ジェノベーゼ",
                                    image_url: "https://www.dominos.jp/common/img/itemimgsx/216.jpg?_=12016",
                                    buttons: [
                                        {type: "postback", title: "注文する", payload: "ジェノベーゼ"},
                                        {type: "web_url", title: "詳細", url: "https://www.dominos.jp/order/pizza/detail/99999/19001/216"}
                                    ]
                                }]
                            }
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {payload:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent text message.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ご注文のピザは？"
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent template button message.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ご注文のピザをお選びください。",
                        quick_replies: [
                            {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                            {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                        ]
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent text message while original message object is quick reply.
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "ご注文のピザをお選びください。",
                        quick_replies: [
                            {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                            {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                            {content_type:"text",title:"カプリチョーザ",payload:"カプリチョーザ"},
                            {content_type:"text",title:"アラビアータ",payload:"アラビアータ"},
                            {content_type:"text",title:"クワトロフォルマッジ",payload:"クワトロフォルマッジ"},
                        ]
                    });
                    return webhook.run(Util.create_req(message_platform, "message", user_id, "マルゲリータ"));
                }
            ).then(
                function(response){
                    // Bot sent template button postback
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ",
                        facebook_quick_reply_more_than_4: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "button",
                                text: "ご注文のピザをお選びください。",
                                buttons: [
                                    {type: "postback", title: "マルゲリータ", payload: "マルゲリータ"},
                                    {type: "postback", title: "マリナーラ", payload: "マリナーラ"}
                                ]
                            }
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {payload:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template button postback and uri
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ",
                        facebook_quick_reply_more_than_4: "マルゲリータ",
                        facebook_template_button_postback: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "button",
                                text: "ご注文のピザをお選びください。",
                                buttons: [
                                    {type: "postback", title: "マルゲリータ", payload: "マルゲリータ"},
                                    {type: "postback", title: "マリナーラ", payload: "マリナーラ"},
                                    {type: "web_url", title: "すべてのメニュー", url: "https://www.dominos.jp/order/pizza/search/"}
                                ]
                            }
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {payload:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template carousel
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ",
                        facebook_quick_reply_more_than_4: "マルゲリータ",
                        facebook_template_button_postback: "マルゲリータ",
                        facebook_template_button_web_url: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: [{
                                    title: "マルゲリータ",
                                    image_url: "https://www.dominos.jp/common/img/itemimgsx/90.jpg?_=12016",
                                    buttons: [
                                        {type: "postback", title: "注文する", payload: "マルゲリータ"},
                                        {type: "web_url", title: "詳細", url: "https://www.dominos.jp/order/pizza/detail/99999/19001/90"}
                                    ]
                                },{
                                    title: "ジェノベーゼ",
                                    image_url: "https://www.dominos.jp/common/img/itemimgsx/216.jpg?_=12016",
                                    buttons: [
                                        {type: "postback", title: "注文する", payload: "ジェノベーゼ"},
                                        {type: "web_url", title: "詳細", url: "https://www.dominos.jp/order/pizza/detail/99999/19001/216"}
                                    ]
                                }]
                            }
                        }
                    });
                    return webhook.run(Util.create_req(message_platform, "postback", user_id, {payload:"マルゲリータ"}));
                }
            ).then(
                function(response){
                    // Bot sent template carousel
                    response.should.have.property("confirmed").and.deep.equal({
                        line_text: "マルゲリータ",
                        line_template_button_postback: "マルゲリータ",
                        line_template_button_message: "マルゲリータ",
                        line_template_button_uri: "マルゲリータ",
                        line_template_button_uri_more_than_3: "マルゲリータ",
                        line_template_confirm: "はい",
                        line_template_carousel: "マルゲリータ",
                        facebook_text: "マルゲリータ",
                        facebook_quick_reply: "マルゲリータ",
                        facebook_quick_reply_more_than_4: "マルゲリータ",
                        facebook_template_button_postback: "マルゲリータ",
                        facebook_template_button_web_url: "マルゲリータ",
                        facebook_template_generic: "マルゲリータ"
                    });
                    response.previous.message[0].from.should.equal("bot");
                    response.previous.message[0].message.should.deep.equal({
                        text: "完了"
                    });
                }
            );
        });
    });
});
