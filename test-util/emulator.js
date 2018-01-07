"use strict";

require("dotenv").config();

const fs = require("fs");
const request = require("request");
const debug = require("debug")("bot-express:test");
const TEST_WEBHOOK_URL = process.env.TEST_WEBHOOK_URL;
Promise = require("bluebird");
Promise.promisifyAll(request);

module.exports = class TestUtilEmulator {
    /**
    @constructor
    @param {String} messenger_type - Supported values are "line", "facebook", "unsupported".
    @param {Object} options - Parameters required by the messenger.
    */
    constructor(messenger_type, options){
        this.messenger_type = messenger_type;

        let scritps = fs.readdirSync(__dirname + "/messenger");
        for (let script of scritps){
            if (script.replace(".js", "") == messenger_type){
                debug("Found plugin for specified messenger. Loading " + script + "...");
                let Messenger = require("./messenger/" + messenger_type);
                this.messenger = new Messenger(options);
            }
        }
    }

    /**
    Method to send event to webhook.
    @method
    @param {Object} event - Event object.
    */
    send(event){
        let url = TEST_WEBHOOK_URL;
        let body = this._create_body(event);
        let headers = this._create_header(body);

        return request.postAsync({
            url: url,
            headers: headers,
            body: body,
            json: true
        }).then((response) => {
            if (response.statusCode == 200){
                return response.body;
            }
            return Promise.reject(new Error(response.body));
        });
    }

    /**
    Method to create message event.
    @method
    @param {String|Object} source - Source id or object.
    @param {String|Object} message - Message text or object.
    */
    create_message_event(source, message){
        return this.messenger.create_message_event(source, message);
    }

    /**
    Method to create postback event.
    @param {String|Object} source - Source id or object.
    @param {Object} postback - Postback object.
    */
    create_postback_event(source, postback){
        return this.messenger.create_postback_event(source, postback);
    }

    /**
    Method to create unsupported event.
    @method
    @param {String|Object} source - Source id or object.
    */
    create_unsupported_event(source){
        return this.messenger.create_unsupported_event(source);
    }

    /**
    Method to clear context.
    @method
    @param {String} mem_id - Memory id to create context.
    @return {Promise}
    */
    clear_context(mem_id){
        let event = {
            type: "bot-express:push",
            to: {
                type: "user",
                userId: mem_id
            },
            intent: {
                name: "clear-context"
            }
        }
        return this.send(event);
    }

    /**
    Method to create request body to thrown to webhook.
    @method
    @param {Object} event - Event object.
    */
    _create_body(event){
        return this.messenger.create_body(event);
    }

    /**
    Method to create request header to thrown to webhook.
    @method
    @param {Object} body - Body of the request. This is required to generate signature
    */
    _create_header(body){
        return this.messenger.create_header(body);
    }
}
