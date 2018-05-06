"use strict";

const debug = require("debug")("bot-express:parser");
const cache = require("memory-cache");
const dialogflow = require("dialogflow");
const structjson = require("./dialogflow/structjson");
const default_language = "ja";
const required_options = ["project_id"];

/**
@constructor
@param {Object} options
@param {String} options.project_id
@param {String} [options.key_filename] - Full path to the a .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
@param {String} [options.client_email] - The parameter you can find in .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
@param {String} [options.private_key] - The parameter you can find in .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
@param {String} [options.language] - The language to analyze.
@param {Object} param
@param {String} param.key
@param {String} param.value
@param {Object} bot
@param {Object} event
@param {Object} context
@param {Function} resolve
@param {Function} reject
*/
module.exports = (options, param, bot, event, context, resolve, reject) => {
    for (let required_option of required_options){
        if (!options[required_option]){
            throw new Error(`Required option "${required_option}" of ParserDialogflow not set.`);
        }
    }
    const language = options.language || default_language;

    // We reuse the sessions client from cache if possible.
    let sessions_client;
    sessions_client = cache.get("dialogflow_sessions_client");
    if (sessions_client){
        debug("Dialogflow sessions client found in cache.");
    } else {
        let sessions_client_option = {
            project_id: options.project_id
        }

        if (options.key_filename){
            sessions_client_option.keyFilename = options.key_filename;
        } else if (options.client_email && options.private_key){
            sessions_client_option.credentials = {
                client_email: options.client_email,
                private_key: options.private_key.replace(/\\n/g, '\n')
            }
        } else {
            throw new Error(`key_filename or (client_email and private_key) option is required for ParserDialogflow.`);
        }

        sessions_client = new dialogflow.SessionsClient(sessions_client_option);
        cache.put("dialogflow_sessions_client", sessions_client);
    }

    const session_path = sessions_client.sessionPath(options.project_id, options.project_id);

    if (typeof param.value != "string") return reject();
    if (!param.value) return reject();

    return sessions_client.detectIntent({
        session: session_path,
        queryInput: {
            text: {
                text: param.value,
                languageCode: options.language
            }
        }
    }).then(responses => {
        const parameters = structjson.jsonToStructProto(
            structjson.structProtoToJson(responses[0].queryResult.parameters)
        );

        if (parameters.fields[param.key] && parameters.fields[param.key][parameters.fields[param.key].kind]){
            return resolve(parameters.fields[param.key][parameters.fields[param.key].kind]);
        }
        return reject();
    })
}
