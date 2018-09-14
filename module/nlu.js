"use strict";

const debug = require("debug")("bot-express:nlu");
const default_service = "dialogflow";
const fs = require("fs");

/**
* Natural Language Processing Abstraction Class
* @class
*/
class Nlu {

    /**
    * @constructor
    * @param {Object} options
    * @param {String} [options.type="dialogflow"] - NLU Service. Supported services are located in nlu directory.
    * @param {Object} options.options - Options depending on the NLU service.
    */
    constructor(options = {}){
        if (!options.type) options.type = default_service;

        let scripts = fs.readdirSync(__dirname + "/nlu");
        for (let script of scripts){
            if (!script.match(/.js$/)){
                // Skip directory or other non-js file.
                continue;
            }
            if (script.replace(".js", "") == options.type){
                debug("Found plugin for specified NLU service. Loading " + script + "...");
                let Service = require("./nlu/" + options.type);
                this.service = new Service(options.options);
            }
        }

        if (!this.service){
            throw new Error("Specified NLU service is not supported for NLU.");
        }
    }

    /**
    Identify the intent of given sentence.
    @function
    @param {String} sentence - Sentence to identify intent.
    @param {Object} options - Option.
    @param {String} options.session_id - Session id of this conversation.
    @param {String} [options.language] - Language of the sentence.
    @returns {intent} intent - Intent Object.
    */
    identify_intent(sentence, options){
        return this.service.identify_intent(sentence, options);
    }
}

module.exports = Nlu;
