"use strict";

const debug = require("debug")("bot-express:parser");

module.exports = class ParserNumber {
    /**
     * @constructor
     * @param {Object} [options]
     */
    constructor(options){
        this.type = "number";
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
     * @param {Object} [policy]
     * @param {Number} [policy.min]
     * @param {Number} [policy.max]
     * @param {String} [policy.type="float"] - Supported values are "float" and "integer".
     * @return {String} - Parsed value.
     */
    async parse(value, policy = {}){
        policy.type = policy.type || "float"

        let parsed_value
        if (policy.type == "integer"){
            parsed_value = parseInt(value)
        } else {
            parsed_value = parseFloat(value)
        }

        if (isNaN(parsed_value)){
            // Check if this is postback and numberable value is set in value.data.
            if (typeof value == "object"){
                parsed_value = parseInt(value.data);
            }

            // Check once again and throw error if it is still NaN.
            if (isNaN(parsed_value)){
                throw new Error("be_parser__should_be_number");
            }
        }

        if (policy.min){
            if (parsed_value < policy.min){
                throw new Error("be_parser__too_small");
            }
        }

        if (policy.max){
            if (parsed_value> policy.max){
                throw new Error("be_parser__too_large");
            }
        }

        return parsed_value;
    }
}
