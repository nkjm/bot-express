"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillCompileMessage {

    constructor() {
        this.required_parameter = {
            line_text: { // Will be text in facebook.
                message_to_confirm: {
                    type: "text",
                    text: "ご注文のピザは？"
                }
            },
            line_template_button_postback: { // Will be quick reply in facebook.
                message_to_confirm: {
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
                },
                parser: (postback, bot, event, context, resolve, reject) => {
                    if (typeof postback == "string"){
                        return resolve(postback);
                    }
                    if (bot.type == "line"){
                        return resolve(postback.data);
                    } else if (bot.type == "facebook"){
                        return resolve(postback.payload);
                    }
                    return reject();
                }
            },
            line_template_button_message: { // Will be quick reply in facebook.
                message_to_confirm: {
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
                }
            },
            line_template_button_uri: { // Will be template button in facebook.
                message_to_confirm: {
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
                },
                parser: (postback, bot, event, context, resolve, reject) => {
                    if (typeof postback == "string"){
                        return resolve(postback);
                    }
                    if (bot.type == "line"){
                        return resolve(postback.data);
                    } else if (bot.type == "facebook"){
                        return resolve(postback.payload);
                    }
                    return reject();
                }
            },
            line_template_button_uri_more_than_3: { // Will catch exception in facebook.
                message_to_confirm: {
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
                },
                parser: (postback, bot, event, context, resolve, reject) => {
                    if (typeof postback == "string"){
                        return resolve(postback);
                    }
                    if (bot.type == "line"){
                        return resolve(postback.data);
                    } else if (bot.type == "facebook"){
                        return resolve(postback.payload);
                    }
                    return reject();
                }
            },
            line_template_confirm: { // Will be quick reply in facebook.
                message_to_confirm: {
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
                }
            },
            line_template_carousel: { // Will be template generic
                message_to_confirm: {
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
                },
                parser: (postback, bot, event, context, resolve, reject) => {
                    if (typeof postback == "string"){
                        return resolve(postback);
                    }
                    if (bot.type == "line"){
                        return resolve(postback.data);
                    } else if (bot.type == "facebook"){
                        return resolve(postback.payload);
                    }
                    return reject();
                }
            },
            /*
            line_image: {
                message_to_confirm: {
                    type: "image",
                    originalContentUrl: "https://www.dropbox.com/sh/lbmx3s1yg392mvh/AAAwCzdEjO_I5OK9nrbDurdra?dl=1"
                }
            },
            line_video: {
                message_to_confirm: {
                    type: "video",
                    originalContentUrl: "https://www.dropbox.com/sh/lbmx3s1yg392mvh/AAAwCzdEjO_I5OK9nrbDurdra?dl=1"
                }
            },
            line_audio: {
                message_to_confirm: {
                    type: "sticker",
                    originalContentUrl: "https://www.dropbox.com/sh/lbmx3s1yg392mvh/AAAwCzdEjO_I5OK9nrbDurdra?dl=1"
                }
            },
            line_sticker: {
                message_to_confirm: {
                    type: "sticker",

                }
            },
            line_location: {
                message_to_confirm: {
                    type: "location",

                }
            },
            line_imagemap: {
                message_to_confirm: {
                    type: "imagemap",
                    originalContentUrl: "https://www.dropbox.com/sh/lbmx3s1yg392mvh/AAAwCzdEjO_I5OK9nrbDurdra?dl=1"
                }
            }
            */
            facebook_text: { // Will be text in line.
                message_to_confirm: {
                    text: "ご注文のピザは？"
                }
            },
            facebook_quick_reply: { // Will be template button message in line.
                message_to_confirm: {
                    text: "ご注文のピザをお選びください。",
                    quick_replies: [
                        {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                        {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                    ]
                }
            },
            facebook_quick_reply_more_than_4: { // Will be text in line.
                message_to_confirm: {
                    text: "ご注文のピザをお選びください。",
                    quick_replies: [
                        {content_type:"text",title:"マルゲリータ",payload:"マルゲリータ"},
                        {content_type:"text",title:"マリナーラ",payload:"マリナーラ"},
                        {content_type:"text",title:"カプリチョーザ",payload:"カプリチョーザ"},
                        {content_type:"text",title:"アラビアータ",payload:"アラビアータ"},
                        {content_type:"text",title:"クワトロフォルマッジ",payload:"クワトロフォルマッジ"},
                    ]
                }
            },
            facebook_template_button_postback: { // Will be template button postback in line.
                message_to_confirm: {
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
                },
                parser: (postback, bot, event, context, resolve, reject) => {
                    if (typeof postback == "string"){
                        return resolve(postback);
                    }
                    if (bot.type == "line"){
                        return resolve(postback.data);
                    } else if (bot.type == "facebook"){
                        return resolve(postback.payload);
                    }
                    return reject();
                }
            },
            facebook_template_button_web_url: { // Will be template button postback and uri in line.
                message_to_confirm: {
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
                },
                parser: (postback, bot, event, context, resolve, reject) => {
                    if (typeof postback == "string"){
                        return resolve(postback);
                    }
                    if (bot.type == "line"){
                        return resolve(postback.data);
                    } else if (bot.type == "facebook"){
                        return resolve(postback.payload);
                    }
                    return reject();
                }
            },
            facebook_template_generic: { // Will be template carousel in line.
                message_to_confirm: {
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
                },
                parser: (postback, bot, event, context, resolve, reject) => {
                    if (typeof postback == "string"){
                        return resolve(postback);
                    }
                    if (bot.type == "line"){
                        return resolve(postback.data);
                    } else if (bot.type == "facebook"){
                        return resolve(postback.payload);
                    }
                    return reject();
                }
            }
            /*
            facebook_audio: {
                message_to_confirm: {

                }
            },
            facebook_file: {
                message_to_confirm: {

                }
            },
            facebook_image: {
                message_to_confirm: {

                }
            },
            facebook_video: {
                message_to_confirm: {

                }
            }
            */
        };
    }

    // パラメーターが全部揃ったら実行する処理を記述します。
    finish(bot, event, context, resolve, reject){
        let messages = [{
            text: "完了"
        }];
        return bot.reply(messages).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
