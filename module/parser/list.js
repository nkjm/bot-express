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
     * @param {Object} param 
     * @param {String} param.key
     * @param {*} param.value
     * @param {Object} policy
     * @param {Number} policy.list
     * @return {*} - Parsed value.
     */
    async parse(param, policy){
        if (!(policy && policy.list && policy.list.length > 0)){
            throw new Error("policy_should_have_list");
        }
    
        if (!policy.list.includes(param.value)){
            throw new Error("value_not_found_in_list");
        }

        return param.value;
    }
}
