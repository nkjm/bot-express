"use strict";

require("dotenv").config();

const fs = require("fs");
const request = require("request");
const debug = require("debug")("bot-express:test");
const TEST_WEBHOOK_URL = process.env.TEST_WEBHOOK_URL;
const Promise = require("bluebird");
Promise.promisifyAll(request);

module.exports = class TestUtilEmulator {
    /**
     * @constructor
     * @param {String} messenger_type - Supported values are "line", "facebook", "unsupported".
     * @param {Object} options - Parameters required by the messenger.
     * @param {String} line_user_id 
     */
    constructor(messenger_type, options, line_user_id){
        this.messenger_type = messenger_type;

        let scripts = fs.readdirSync(__dirname + "/messenger");
        for (let script of scripts){
            if (script.replace(".js", "") == messenger_type){
                debug("Found plugin for specified messenger. Loading " + script + "...");
                let Messenger = require("./messenger/" + messenger_type);
                this.messenger = new Messenger(options);
            }
        }
        this.line_user_id = line_user_id
    }

    async say(message_text){
        const event = this.create_message_event(this.line_user_id, message_text)
        return this.send(event)
    }

    async postback(data){
        const event = this.create_postback_event(this.line_user_id, {data: (typeof data === "string") ? data : JSON.stringify(data)})
        return this.send(event)
    }

    async postback_params(params){
        const event = this.create_postback_event(this.line_user_id, {params: params})
        return this.send(event)
    }

    async launch(skill_name, parameters, language){
        const event = this.create_postback_event(this.line_user_id, {data: JSON.stringify({
            type: "intent",
            intent: {
                name: skill_name,
                parameters: parameters
            },
            language: language
        })})
        return this.send(event)
    }

    /**
    Method to send event to webhook.
    @method
    @param {Object} event - Event object.
    */
    async send(event){
        let url = TEST_WEBHOOK_URL;
        let body = this._create_body(event);
        let headers = this._create_header(body);

        let res = await request.postAsync({
            url: url,
            headers: headers,
            body: body,
            json: true
        })

        if (res.statusCode == 200){
            return res.body;
        }

        const e = new Error(res.body.message);
        e.name = res.body.name;
        throw e;
    }

    /**
     * @param {*} o 
     * @param {Boolean} o.clear_confirmed
     * @returns 
     */
    async modify_previous(o = {}){
        return this.postback({
            type: "intent",
            intent: {
                name: "modify-previous-parameter",
                parameters: {
                    clear_confirmed: o.clear_confirmed
                }
            }
        })
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
                userId: mem_id || this.line_user_id
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
