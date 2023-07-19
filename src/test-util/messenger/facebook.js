"use strict";

const debug = require("debug")("bot-express:test");
const crypto = require("crypto");

module.exports = class TestUtilMessengerFacebook {
    /**
    @constructor
    @param {Object} options
    @param {Object} options.facebook_app_secret
    */
    constructor(options){
        this.options = options;
    }

    create_body(event){
        let body = {
            object: "page",
            entry: [{
                messaging: [event]
            }]
        }
        return body;
    }

    create_header(body){
        let signature = "sha1=" + crypto.createHmac("sha1", this.options.facebook_app_secret).update(JSON.stringify(body)).digest("hex");
        let header = {"X-Hub-Signature": signature};
        return header;
    }

    create_message_event(source, message){
        let event = {
            sender: {},
            recipient: {
                id: "dummy"
            },
            timestamp: Date.now()
        }

        if (typeof source === "string"){
            event.sender.id = source;
        } else {
            event.sender = source;
        }

        if (typeof message === "string"){
            event.message = {
                text: message
            }
        } else {
            event.message = message;
        }

        return event;
    }

    create_postback_event(source, postback){
        let event = {
            sender: {},
            recipient: {
                id: "dummy"
            },
            timestamp: Date.now(),
            postback: postback
        }

        if (typeof source === "string"){
            event.sender.id = source;
        } else {
            event.sender = source;
        }

        return event;
    }

    create_unsupported_event(source){
        let event = {
            sender: {},
            recipient: {
                id: "dummy"
            },
            timestamp: Date.now()
        }

        if (typeof source === "string"){
            event.sender.id = source;
        } else {
            event.sender = source;
        }

        return event;
    }
}
