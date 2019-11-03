"use strict";

const debug = require("debug")("bot-express:parser");

module.exports = class ParserList {
    /**
     * @constructor
     * @param {Object} [options]
     */
    constructor(options){
        this.type = "list";
        this.required_options = [];

        for (let required_option of this.required_options){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" not set.`);
            }
        }
    }

    /**
     * @method
     * @param {*} value
     * @param {Object} policy
     * @param {Number} policy.list
     * @return {*} - Parsed value.
     */
    async parse(value, policy){
        if (!(policy && Array.isArray(policy.list) && policy.list.length > 0)){
            debug(`policy.list should have array of value.`)
            throw new Error()
        }
    
        if (!policy.list.includes(value)){
            throw new Error("be_parser__should_be_in_list");
        }

        return value;
    }
}
