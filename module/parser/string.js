"use strict";

const debug = require("debug")("bot-express:parser");
const wanakana = require("wanakana");

module.exports = class ParserString {
    /**
     * @constructor
     * @param {Object} [options]
     */
    constructor(options){
        this.type = "string";
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
     * @param {String} [policy.charactor] - Supported values are hiragana and katakana.
     * @param {String} [policy.regex] - Regex expression to match value.
     * @return {String} - Parsed value.
     */
    async parse(param, policy = {}){
        if (typeof param.value != "string"){
            throw new Error("should_be_string");
        }
        if (!param.value){
            throw new Error("value_is_empty");
        }

        if (policy.min){
            if (param.value.length < policy.min){
                throw new Error("violates_min");
            }
        }

        if (policy.max){
            if (param.value.length > policy.max){
                throw new Error("violates_max");
            }
        }

        let parsed_value;

        if (policy.charactor){
            if (policy.charactor === "katakana"){
                parsed_value = wanakana.toKatakana(param.value);
                if (!wanakana.isKatakana(parsed_value)){
                    throw new Error("should_be_katakana");
                }
            }

            if (policy.charactor === "hiragana"){
                parsed_value = wanakana.toHiragana(param.value);
                if (!wanakana.isHiragana(parsed_value)){
                    throw new Error("should_be_hiragana");
                }
            }
        } else {
            parsed_value = param.value;
        }

        if (policy.regex){
            if (!param.value.match(policy.regex)){
                throw new Error("should_follow_regex");
            }
        }

        return parsed_value;
    }
}
