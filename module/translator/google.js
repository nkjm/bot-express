'use strict';

const {Translate} = require('@google-cloud/translate');
const debug = require("debug")("bot-express:translator");
const required_options = ["project_id"];

/**
* Translator implementation of google
* @class
*/
class TranslatorGoogle {
    /**
    @constructor
    @param {Object} options
    @param {String} options.project_id
    @param {String} [options.api_key] - API Key. Either of api_key or key_filename or combination of client_email and private_key is required.
    @param {String} [options.key_filename] - Full path to the a .json key from the Google Developers Console. Either of api_key or key_filename or combination of client_email and private_key is required.
    @param {String} [options.client_email] - The parameter you can find in .json key from the Google Developers Console. Either of api_key or key_filename or combination of client_email and private_key is required.
    @param {String} [options.private_key] - The parameter you can find in .json key from the Google Developers Console. Either of api_key or key_filename or combination of client_email and private_key is required.
    */
    constructor(options){
        for (let required_option of required_options){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" of TranslatorGoogle not set.`);
            }
        }

        let google_options = {};

        if (options.api_key){
            google_options = {
                projectId: options.project_id,
                key: options.api_key
            }
        } else if (options.key_filename){
            google_options = {
                projectId: options.project_id,
                keyFilename: options.key_filename
            }
        } else if (options.client_email && options.private_key){
            google_options = {
                projectId: options.project_id,
                credentials: {
                    client_email: options.client_email,
                    private_key: options.private_key.replace(/\\n/g, '\n')
                }
            }
        } else {
            throw new Error(`key_filename or (client_email and private_key) option is required for TranslatorGoogle.`);
        }

        // Instantiates a translater
        this.translator = new Translate(google_options);
    }

    async detect(text){
        let detect_response = await this.translator.detect(text);
        if (detect_response && detect_response[0] && detect_response[0].language){
            return detect_response[0].language;
        } else {
            throw new Error(`Could not detect language for following text: "${text}".`);
        }
    }

    async translate(text, lang){
        let translated_text = await this.translator.translate(text, lang);
        if (typeof text == "string" && translated_text[0]){
            return translated_text[0];
        } else {
            return translated_text;
        }
    }
}

module.exports = TranslatorGoogle;
