"use strict";

const debug = require("debug")("bot-express:parser");

module.exports = class ParserEmail {
    /**
     * @constructor
     * @param {Object} [options]
     */
    constructor(options){
        this.type = "email";
        this.required_options = [];

        for (let required_option of this.required_options){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" not set.`)
            }
        }
    }

    /**
     * @method
     * @param {String} value
     * @param {Object} [policy]
     * @param {Boolean} [policy.required=true] - Set false to accept empty value.
     */
    async parse(value, policy = {}){
        policy.required = (policy.required === undefined) ? true : policy.required

        if (!value){
            if (policy.required){
                throw new Error("be_parser__should_be_set")
            } else {
                return value
            }
        }
        
        if (typeof value !== "string"){
            throw new Error(`be_parser__should_be_string`)
        }

        const regex = new RegExp(/^[a-zA-Z0-9_+-]+(.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/)
        if (!value.match(regex)){
            throw new Error(`be_parser__should_be_email_format`)
        }

        return value
    }
}
