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
     * @param {Boolean} [policy.required=true]
     * @return {*} - Parsed value.
     */
    async parse(value, policy){
        policy.required = (policy.required === undefined) ? true : policy.required

        if (!(policy && Array.isArray(policy.list) && policy.list.length > 0)){
            debug(`policy.list should have array of value.`)
            throw new Error()
        }

        if (!policy.required && (!value || (Array.isArray(value) && value.length == 0))){
            return value
        }
    
        if (Array.isArray(value)){
            // If value is array, we check each element exists in list.
            for (const elem of value){
                if (!policy.list.includes(elem)){
                    throw new Error("be_parser__should_be_in_list");
                }
            }
        } else {
            if (!policy.list.includes(value)){
                throw new Error("be_parser__should_be_in_list");
            }
        }

        return value;
    }
}
