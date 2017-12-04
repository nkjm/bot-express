'use strict';

const apiai = require("apiai");
const debug = require("debug")("bot-express:nlu");
const default_language = "ja";
const required_options = ["client_access_token"];

Promise = require("bluebird");

module.exports = class NluDialogflow {
    constructor(options){
        required_options.map((required_option) => {
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" of Dialogflow not set.`);
            }
        })
        this._client_access_token = options.client_access_token;
        this._developer_access_token = options.developer_access_token;
        this._language = options.language || default_language;
    }

    identify_intent(sentence, options){
        if (!options.session_id){
            throw new Error(`Required option "session_id" for apiai.indentify_intent() not set.`);
        }

        let ai_instance = apiai(this._client_access_token, {language: this._language});
        let ai_request = ai_instance.textRequest(sentence, {sessionId: options.session_id});
        let promise_got_intent = new Promise((resolve, reject) => {
            ai_request.on('response', (response) => {
                let intent = {
                    name: response.result.action,
                    parameters: response.result.parameters,
                    text_response: response.result.fulfillment.speech,
                    fulfillment: response.result.fulfillment
                }
                return resolve(intent);
            });
            ai_request.end();
        });
        return promise_got_intent;
    }
}
