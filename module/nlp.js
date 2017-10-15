"use strict";

let debug = require("debug")("bot-express:nlp");
let Promise = require("bluebird");

// If we add NLP service, we need to add required options below.
const required_options = {
    apiai: ["client_access_token", "language"]
};

/**
* Natural Language Processing Abstraction Class
* @class
*/
class Nlp {
    constructor(type, options){
        this.type = type; // The script having the filename identical to this type value has to exist under nlp dir.

        // Check Required Option.
        for (let required_option of required_options[this.type]){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" for ${this.type} not set`);
            }
        }

        let Nlp_service = require(`./nlp/${this.type}`);
        this.service = new Nlp_service(options);
    }

    /**
    Identify the intent of given sentence.
    @function
    @param {String} sentence - Sentence to identify intent.
    @param {Object} options - Option.
    @param {String} options.session_id - Session id of this conversation.
    @returns {Object} intent - Intent Object.
    @returns {String} intent.name - Name of the intent.
    @returns {Object} intent.parameters - Parameters found in the sentence.
    @returns {String} intent.text_response - Text response to the sentence.
    @returns {Object} intent.fulfillment - Object to fulfill the action.
    */
    identify_intent(sentence, options){
        return this.service.identify_intent(sentence, options);
    }
}

module.exports = Nlp;
