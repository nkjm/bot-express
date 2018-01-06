"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");

chai.use(chaiAsPromised);
const should = chai.should();


describe("Test compile message from line", function(){
    const messenger_option = {
        name: "line",
        options: {
            line_channel_secret: process.env.LINE_CHANNEL_SECRET
        }
    }
    const emu = new Emulator(messenger_option.name, messenger_option.options);
    const user_id = "compile-message";

    describe("handle-pizza-order-in-various-format", function(){
        it(`will translate message object from ${emu.messenger_type} to facebook.`, function(){
            this.timeout(5000);

            return emu.clear_context(user_id).then(function(){
                let event = emu.create_postback_event(user_id, {
                    data: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "handle-pizza-order-in-various-format"
                        }
                    })
                });
                return emu.send(event);
            }).then(function(context){
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    type: "text",
                    text: "ご注文のピザは？"
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button postback.
                context.should.have.property("confirmed").and.deep.equal({line_text: "マルゲリータ"});
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button message.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button uri.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button uri more than 3.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template confirm.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ",
                    line_template_button_uri_more_than_3: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_message_event(user_id, "はい");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template carousel.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ",
                    line_template_button_uri_more_than_3: "マルゲリータ",
                    line_template_confirm: "はい"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent text message.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ",
                    line_template_button_uri_more_than_3: "マルゲリータ",
                    line_template_confirm: "はい",
                    line_template_carousel: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    type: "text",
                    text: "ご注文のピザは？"
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button message.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ",
                    line_template_button_uri_more_than_3: "マルゲリータ",
                    line_template_confirm: "はい",
                    line_template_carousel: "マルゲリータ",
                    facebook_text: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent text message while original message object is quick reply.
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    type: "text",
                    text: "ご注文のピザをお選びください。"
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button postback
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button postback and uri
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template carousel
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {data:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template carousel
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    type: "text",
                    text: "完了"
                });
            });
        });
    });
});

describe("Test compile message from facebook", function(){
    const messenger_option = {
        name: "facebook",
        options: {
            facebook_app_secret: process.env.FACEBOOK_APP_SECRET
        }
    }
    const emu = new Emulator(messenger_option.name, messenger_option.options);
    const user_id = "compile-message";

    describe("handle-pizza-order-in-various-format", function(){
        it(`will translate message object from ${emu.messenger_type} to line.`, function(){
            this.timeout(5000);

            return emu.clear_context(user_id).then(function(){
                let event = emu.create_postback_event(user_id, {
                    payload: JSON.stringify({
                        _type: "intent",
                        intent: {
                            name: "handle-pizza-order-in-various-format"
                        }
                    })
                });
                return emu.send(event);
            }).then(function(context){
                // Bot sent text message.
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "ご注文のピザは？"
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent quick reply message.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "ご注文のピザをお選びください。",
                    quick_replies: [
                        {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                        {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                        {content_type:"text",title:"カプリチョーザ",payload:"カプリチョーザ"},
                        {content_type:"text",title:"クワトロフォルマッジ",payload:"クワトロフォルマッジ"}
                    ]
                });
                let event = emu.create_postback_event(user_id, {payload:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent quick reply
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "ご注文のピザをお選びください。",
                    quick_replies: [
                        {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                        {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                        {content_type:"text",title:"カプリチョーザ",payload:"カプリチョーザ"},
                        {content_type:"text",title:"クワトロフォルマッジ",payload:"クワトロフォルマッジ"}
                    ]
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button uri.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {payload:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot tried to compile template button uri more than 3 but could not. So sent text message.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "ご注文のピザをお選びください。 *Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message."
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent quick reply
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ",
                    line_template_button_uri_more_than_3: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "ご注文は以上ですか？",
                    quick_replies: [
                        {content_type:"text",title:"はい",payload:"はい"},
                        {content_type:"text",title:"いいえ",payload:"いいえ"},
                    ]
                });
                let event = emu.create_message_event(user_id, "はい");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template generic
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ",
                    line_template_button_uri_more_than_3: "マルゲリータ",
                    line_template_confirm: "はい"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {payload:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent text message.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ",
                    line_template_button_uri_more_than_3: "マルゲリータ",
                    line_template_confirm: "はい",
                    line_template_carousel: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "ご注文のピザは？"
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button message.
                context.should.have.property("confirmed").and.deep.equal({
                    line_text: "マルゲリータ",
                    line_template_button_postback: "マルゲリータ",
                    line_template_button_message: "マルゲリータ",
                    line_template_button_uri: "マルゲリータ",
                    line_template_button_uri_more_than_3: "マルゲリータ",
                    line_template_confirm: "はい",
                    line_template_carousel: "マルゲリータ",
                    facebook_text: "マルゲリータ"
                });
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "ご注文のピザをお選びください。",
                    quick_replies: [
                        {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                        {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                    ]
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent text message while original message object is quick reply.
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "ご注文のピザをお選びください。",
                    quick_replies: [
                        {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                        {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                        {content_type:"text",title:"カプリチョーザ",payload:"カプリチョーザ"},
                        {content_type:"text",title:"アラビアータ",payload:"アラビアータ"},
                        {content_type:"text",title:"クワトロフォルマッジ",payload:"クワトロフォルマッジ"},
                    ]
                });
                let event = emu.create_message_event(user_id, "マルゲリータ");
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button postback
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {payload:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template button postback and uri
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {payload:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template carousel
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
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
                let event = emu.create_postback_event(user_id, {payload:"マルゲリータ"});
                return emu.send(event);
            }).then(function(context){
                // Bot sent template carousel
                context.should.have.property("confirmed").and.deep.equal({
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
                context.previous.message[0].from.should.equal("bot");
                context.previous.message[0].message.should.deep.equal({
                    text: "完了"
                });
            });
        });
    });
});
