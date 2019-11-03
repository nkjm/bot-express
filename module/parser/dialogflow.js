"use strict";

const debug = require("debug")("bot-express:parser");
const dialogflow = require("dialogflow");
const structjson = require("./dialogflow/structjson");
const default_language = "ja";

module.exports = class ParserDialogflow {
    /**
     * @constructor
     * @param {Object} options
     * @param {String} options.project_id
     * @param {String} [options.key_filename] - Full path to the a .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
     * @param {String} [options.client_email] - The parameter you can find in .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
     * @param {String} [options.private_key] - The parameter you can find in .json key from the Google Developers Console. Either of key_filename or combination of client_email and private_key is required.
     * @param {String} [options.language] - The language to analyze.
     */
    constructor(options){
        this.type = "dialogflow";
        this.required_options = ["project_id"];

        for (let required_option of this.required_options){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" of ParserDialogflow not set.`);
            }
        }

        this.language = options.language || default_language;

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

        this.sessions_client = new dialogflow.SessionsClient(sessions_client_option);
        this.session_path = this.sessions_client.sessionPath(options.project_id, options.project_id);
    }

    /**
     * @method
     * @param {String} value
     * @param {Object} policy
     * @param {String} policy.parameter_name - Parameter name which dialogflow looks up.
     */
    async parse(value, policy){
        if (!(policy && policy.parameter_name)){
            debug(`Required policy parameter: parameter_name not set.`)
            throw new Error()
        }

        if (!value){
            throw new Error("be_parser__should_be_set")
        }
        if (typeof value !== "string"){
            throw new Error("be_parser__should_be_string")
        }

        const responses = await this.sessions_client.detectIntent({
            session: this.session_path,
            queryInput: {
                text: {
                    text: value,
                    languageCode: this.language
                }
            }
        });

        if (responses[0].queryResult.action){
            debug("Builtin parser found an intent but it seems for another purpose so reject it.")
            throw new Error()
        }

        const parameters = structjson.structProtoToJson(responses[0].queryResult.parameters)
        debug("Detected parameters are following.")
        debug(parameters)

        if (!parameters[policy.parameter_name]){
            throw new Error("be_parser__corresponding_parameter_not_found")
        }

        return parameters[policy.parameter_name]
    }
}
