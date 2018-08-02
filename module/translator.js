"use strict";

const debug = require("debug")("bot-express:translator");
const default_service = "google";
const fs = require("fs");

/**
* Translator Abstraction Class
* @class
*/
class Translator {

    /**
    @constructor
    @param {Object} options
    @param {String} [options.type="google"] - Supported services are located in translator directory.
    @param {Boolean} [options.enable_lang_detection=true] - Flag to enable language detection.
    @param {Boolean} [options.enable_translation=false] - Flag to enable translation.
    @param {Object} options.options - Options depending on the translator service.
    */
    constructor(options = {}){
        this.type = options.type || default_service;
        this.enable_lang_detection = (options.enable_lang_detection === false) ? false : true;
        this.enable_translation = (options.enable_translation === true) ? true : false;

        let scripts = fs.readdirSync(__dirname + "/translator");
        for (let script of scripts){
            if (!script.match(/.js$/)){
                // Skip directory or other non-js file.
                continue;
            }
            if (script.replace(".js", "") == this.type){
                debug("Found plugin for specified translator service. Loading " + script + "...");
                let Service = require("./translator/" + this.type);
                this.service = new Service(options.options);
            }
        }

        if (!this.service){
            throw new Error("Specified translator service is not supported.");
        }
    }

    /**
    Detect language
    @method
    @param {String} text - Text to detect language.
    @returns {String} ISO-639-1 based language code.
    */
    async detect(text){
        return this.service.detect(text);
    }

    /**
    @method
    @param {String|Array.<String>} text - Text to translate.
    @param {String} lang  ISO-639-1 based language code in which translate to.
    @returns {String|Array.<String>}
    */
    async translate(text, lang){
        return this.service.translate(text, lang);
    }

}

module.exports = Translator;
