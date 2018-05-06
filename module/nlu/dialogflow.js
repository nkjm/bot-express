'use strict';

const dialogflow = require("dialogflow");
const debug = require("debug")("bot-express:nlu");
const default_language = "ja";
const required_options = ["project_id"];

Promise = require("bluebird");

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

        let session_client_option = {
            project_id: options.project_id
        }

        if (options.key_filename){
            session_client_option.keyFilename = options.key_filename;
        } else if (options.client_email && options.private_key){
            session_client_option.credentials = {
                client_email: options.client_email,
                private_key: options.private_key.replace(/\\n/g, '\n')
            }
        } else {
            throw new Error(`key_filename or (client_email and private_key) option is required forNluDialogflow.`);
        }

        this._session_client = new dialogflow.SessionsClient(session_client_option);
    }

    identify_intent(sentence, options){
        if (!options.session_id){
            throw new Error(`Required option "session_id" for NluDialogflow.indentify_intent() not set.`);
        }

        const session_path = this._session_client.sessionPath(this._project_id, options.session_id);

        // The text query request.
        const request = {
            session: session_path,
            queryInput: {
                text: {
                    text: sentence,
                    languageCode: this._language
                }
            }
        };

        // Send request and log result
        return Promise.resolve().then(() => {
            return this._session_client.detectIntent(request);
        }).then(responses => {
            let result = responses[0].queryResult;

            let intent = {
                id: result.intent.name,
                name: result.action || "input.unknown",
                parameters: {},
                text_response: result.fulfillmentText,
                fulfillment: result.fulfillmentMessages,
                dialogflow: responses[0]
            }

            if (result.parameters && result.parameters.fields){
                for (let param_key of Object.keys(result.parameters.fields)){
                    if (result.parameters.fields[param_key] && result.parameters.fields[param_key].kind){
                        intent.parameters[param_key] = result.parameters.fields[param_key][result.parameters.fields[param_key].kind];
                    }
                }
            }

            return intent;
        });
    }
}
