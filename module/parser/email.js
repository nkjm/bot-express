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
     */
    async parse(value, policy = {}){
        if (!value){
            throw new Error(`be_parser__should_be_set`)
        }
        if (typeof value !== "string"){
            throw new Error(`be_parser__should_be_string`)
        }

        const pattern = "^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$"
        if (!value.match(pattern)){
            throw new Error(`be_parser__should_be_email_format`)
        }

        return value;
    }
}
