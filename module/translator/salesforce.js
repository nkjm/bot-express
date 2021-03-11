'use strict';

const debug = require("debug")("bot-express:translator");
const required_option_list = ["db"]

/**
* Translator implementation of salesforce
* @class
*/
class TranslatorSalesforce {
    /**
     * @constructor
     * @param {Object} options
     * @param {Object} options.db
    */
    constructor(options){
        for (let required_option of required_option_list){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" of TranslatorSalesforce not set.`);
            }
        }

        this.db = options.db
        this.translator = this.db
    }

    async detect(text){
        debug(`detect method is not supported in TranslatorSalesforce.`)
    }

    async translate(text, lang){
        debug(`translate method is not supported in TranslatorSalesforce.`)
    }

    async get_translation_label(text, lang){
        return this.db.get_localization({
            label: text,
            lang,
        })
    }
}

module.exports = TranslatorSalesforce;
