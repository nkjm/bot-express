"use strict";

const debug = require("debug")("bot-express:translator");
const default_service = "google";
const default_sender_language = "ja";
const fs = require("fs");

/**
 * Translator Abstraction Class
 * @class
 * @prop {Object} label
 * @prop {String} type
 * @prop {Boolean} enable_lang_detection
 * @prop {Boolean} enable_translation
 * @prop {Object} service
 */
class Translator {
    /**
     * @constructor
     * @param {context} context
     * @param {Object} options
     * @param {String} [options.label_path] - Location of prepared label file.
     * @param {String} [options.type="google"] - External translator. Supported services are located in translator directory.
     * @param {Boolean} [options.enable_lang_detection=true] - Flag to enable language detection by external translator.
     * @param {Boolean} [options.enable_translation=false] - Flag to enable translation by external translator.
     * @param {Object} options.options - Options depending on the translator service.
    */
    constructor(context, options = {}){
        // Try to require translation label.
        try {
            require.resolve(options.label_path);
            this.label = require(options.label_path);
        } catch (e){
            debug(`Translation label not found in ${options.label_path}.`)
        }

        this.context = context;
        this.type = options.type || default_service;
        this.enable_lang_detection = (options.enable_lang_detection === false) ? false : true;
        this.enable_translation = (options.enable_translation === true) ? true : false;

        if (this.enable_lang_detection || this.enable_translation){
            let scripts = fs.readdirSync(__dirname + "/translator");
            if (Array.isArray(scripts)){
                const script = scripts.find(script => script === `${this.type}.js`);
                if (script){
                    debug(`Found plugin for specified translator service. Loading ${script}..`);
                    let Service = require(`./translator/${this.type}`);
                    this.service = new Service(options.options);
                } else {
                    debug(`Specified translator type not found. We disable automatic lang detection and translation.`);
                    this.enable_lang_detection = false;
                    this.enable_translation = false;
                }
            }
        }
    }

    /**
     * Get sender language.
     * @method
     * @return {String} ISO-639-1 based language code.
     */
    get sender_language(){
        return this.context.sender_language || default_sender_language;
    }

    /**
     * Detect language using external translator.
     * @method
     * @async
     * @param {String} text - Text to detect language.
     * @returns {String} ISO-639-1 based language code.
     */
    async detect(text){
        return this.service.detect(text);
    }

    /**
     * Translate text using external translator.
     * @method
     * @async
     * @param {String|Array.<String>} text - Text to translate.
     * @param {String} language  ISO-639-1 based language code in which translate to.
     * @returns {String|Array.<String>}
     */
    async translate(text, language){
        return this.service.translate(text, language);
    }

    /**
     * Return translation label using prepared label file.
     * @method
     * @async
     * @param {String} key - Unique key to get translation label.
     * @param {Object} [options] - Complemental data for translation.
     * @return {String} Translation label.
     */
    async get_translation_label(key, options){
        if (!this.label[key]){
            // If key not found, we throw error.
            throw new Error(`${key} not found or no translation label is available.`);
        }

        // Check if matched translation label exists.
        if (this.label[key][this.sender_language] !== undefined){
            // Check if optional data is provided.
            if (options === undefined){
                // No optional data so label should be string.
                if (typeof this.label[key][this.sender_language] != "string"){
                    throw new Error(`Expecting translation being string but ${typeof this.label[key][this.sender_language]}`);
                }

                return this.label[key][this.sender_language];
            } else {
                // Optional data found so label shoud be function.
                if (typeof this.label[key][this.sender_language] != "function"){
                    throw new Error(`Expecting translation being function but ${typeof this.label[key][this.sender_language]}`);
                }

                return this.label[key][this.sender_language](options);
            }
        }

        // Matched translation label not found.

        // If external translator is available, we make target translation label using first translation label.
        // If external translator is unavailable, we just use first translation label.
        if (Object.keys(this.label[key]).length > 0){

            // Extract the first translation.
            let first_label;
            // Check if optional data is provided.
            if (options === undefined){
                // No optional data so label should be string.
                if (typeof this.label[key][Object.keys(this.label[key])[0]] != "string"){
                    throw new Error(`Expecting translation being string but ${typeof this.label[key][Object.keys(this.label[key])[0]]}`);
                }
                first_label = this.label[key][Object.keys(this.label[key])[0]];
            } else {
                // Optional data found so label shoud be function.
                if (typeof this.label[key][Object.keys(this.label[key])[0]] != "function"){
                    throw new Error(`Expecting translation being function but ${typeof this.label[key][Object.keys(this.label[key])[0]]}`);
                }
                first_label = this.label[key][Object.keys(this.label[key])[0]](options);
            }

            if (this.service && this.enable_translation){
                // If translator is available, we make target translation label using first translation label.
                return await this.translate(first_label, this.sender_language);
            } else {
                // If translator is not available, we just use first translation labe.
                return first_label;
            }
        }
    }

    /**
     * Alias to get_translation_label.
     * @method
     */
    async t(key, options){
        return this.get_translation_label(key, options);
    }
}

module.exports = Translator;
