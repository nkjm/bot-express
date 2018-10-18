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
     * @param {Object} param
     * @param {String} param.key
     * @param {*} param.value
     * @param {Object} [policy]
     * @param {Number} [policy.min]
     * @param {Number} [policy.max]
     * @return {String} - Parsed value.
     */
    async parse(param, policy = {}){
        let parsed_value;

        if (typeof param.value != "number"){
            if (typeof param.value == "string"){
                parsed_value = Number(param.value);

                if (parsed_value === NaN){
                    throw new Error("should_be_number");
                }
            } else if (typeof param.value == "object"){
                let value = param.value.data;
                if (typeof value == "number"){
                    parsed_value = value;
                } else {
                    throw new Error("should_be_number");
                }
            }
        } else {
            parsed_value = param.value;
        }

        if (policy.min){
            if (parsed_value < policy.min){
                throw new Error("violates_min");
            }
        }

        if (policy.max){
            if (parsed_value> policy.max){
                throw new Error("violates_max");
            }
        }

        return parsed_value;
    }
}
