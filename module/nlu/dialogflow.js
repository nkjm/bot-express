'use strict';

const dialogflow = require("dialogflow");
const debug = require("debug")("bot-express:nlu");
const default_language = "ja";
const required_options = ["project_id"];
const cache = require("memory-cache");
const structjson = require("./dialogflow/structjson");

module.exports = class NluDialogflow {
    /**
    @constructor
    @param {Object} options
    @param {String} options.project_id
    @param {String} [options.key_filename] - Full path to the a .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
    @param {String} [options.client_email] - The parameter you can find in .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
    @param {String} [options.private_key] - The parameter you can find in .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
    @param {String} [options.language] - The language to analyze.
    */
    constructor(options){
        for (let required_option of required_options){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" of NluDialogflow not set.`);
            }
        }
        this._project_id = options.project_id;
        this._language = options.language || default_language;

        // We reuse the sessions client from cache if possible.
        /*
        this._sessions_client = cache.get("dialogflow_sessions_client");
        if (this._sessions_client){
            debug("Dialogflow sessions client found in cache.");
            return;
        }
        */

        let sessions_client_option = {
            projectId: options.project_id
        }

        if (options.key_filename){
            sessions_client_option.keyFilename = options.key_filename;
        } else if (options.client_email && options.private_key){
            sessions_client_option.credentials = {
                client_email: options.client_email,
                private_key: options.private_key.replace(/\\n/g, '\n')
            }
        } else {
            throw new Error(`key_filename or (client_email and private_key) option is required forNluDialogflow.`);
        }

        this._sessions_client = new dialogflow.SessionsClient(sessions_client_option);
        //cache.put("dialogflow_sessions_client", this._sessions_client);
    }

    /**
    @method
    @param {String} sentence
    @param {Object} options
    @param {String} options.session_id
    @param {String} [options.language]
    @param {intent}
    */
    async identify_intent(sentence, options){
        if (!options.session_id){
            throw new Error(`Required option "session_id" for NluDialogflow.indentify_intent() not set.`);
        }

        if (this._bytes(sentence) > 256){
            debug(`Sentence exceeds 256 bytes so we return input.unknown.`);
            return {
                name: "input.unknown"
            }
        }

        const session_path = this._sessions_client.sessionPath(this._project_id, options.session_id);

        // The text query request.
        const request = {
            session: session_path,
            queryInput: {
                text: {
                    text: sentence,
                    languageCode: options.language || this._language
                }
            }
        };

        // Send request and log result
        return this._sessions_client.detectIntent(request).then(responses => {
            let result = responses[0].queryResult;

            if (!result.intent){
                result.intent = {}
            }

            let intent = {
                id: result.intent.name,
                name: result.action || "input.unknown",
                parameters: {},
                text_response: result.fulfillmentText,
                fulfillment: [],
                dialogflow: responses[0]
            }

            if (result.parameters){
                intent.parameters = structjson.structProtoToJson(result.parameters);
            }

            if (result.fulfillmentMessages){
                for (let fulfillmentMessage of result.fulfillmentMessages){
                    if (fulfillmentMessage.text && fulfillmentMessage.text.text && fulfillmentMessage.text.text[0]){
                        intent.fulfillment.push({
                            type: "text",
                            text: fulfillmentMessage.text.text[0]
                        });
                    } else if (fulfillmentMessage.payload){
                        intent.fulfillment.push(structjson.structProtoToJson(fulfillmentMessage.payload));
                    }
                }
            }

            return intent;
        });
    }

    _bytes(str) {
        return(encodeURIComponent(str).replace(/%../g,"x").length);
    }
}
