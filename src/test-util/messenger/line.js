"use strict";

const debug = require("debug")("bot-express:test");
const crypto = require("crypto");

module.exports = class TestUtilMessengerLine {
    /**
    @constructor
    @param {Object} options
    @param {Object} options.line_channel_secret
    */
    constructor(options){
        this.options = options;
    }

    create_body(event){
        let body = {
            events: [event]
        }
        return body;
    }

    create_header(body){
        let signature = crypto.createHmac('sha256', this.options.line_channel_secret).update(JSON.stringify(body)).digest('base64');
        let header = {"X-Line-Signature": signature};
        return header;
    }

    create_message_event(source, message){
        let event = {
            replyToken: "dummy",
            type: "message",
            timestamp: Date.now(),
            source: {},
            message: {}
        }

        if (typeof source === "string"){
            event.source = {
                type: "user",
                userId: source
            }
        } else {
            event.source = source;
        }

        if (typeof message === "string"){
            event.message = {
                type: "text",
                text: message
            }
        } else {
            event.message = message;
        }

        if (!event.message.id){
            event.message.id = "dummy";
        }

        return event;
    }

    create_postback_event(source, postback){
        let event = {
            replyToken: "dummy",
            type: "postback",
            timestamp: Date.now(),
            source: {},
            postback: postback
        }

        if (typeof source === "string"){
            event.source = {
                type: "user",
                userId: source
            }
        } else {
            event.source = source;
        }

        return event;
    }

    create_unsupported_event(source){
        let event = {
            replyToken: "dummy",
            type: "unsupported",
            timestamp: Date.now(),
            source: {},
            message: {}
        }

        if (typeof source === "string"){
            event.source = {
                type: "user",
                userId: source
            }
        } else {
            event.source = source;
        }

        return event;
    }
}
