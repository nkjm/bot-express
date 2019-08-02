"use strict";

const debug = require("debug")("bot-express:parser");
const wanakana = require("wanakana");
const sanitize = require("sanitize-html");

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
     * @asnyc
     * @param {*} value
     * @param {Object} [policy]
     * @param {Number} [policy.min]
     * @param {Number} [policy.max]
     * @param {String} [policy.character] - Supported values are hiragana and katakana.
     * @param {Array.<String>} [policy.exclude] - List of values to be rejected.
     * @param {String} [policy.regex] - Regex expression to match value.
     * @param {Boolean} [policy.sanitize] - Sanitize string if true.
     * @return {String} - Parsed value.
     */
    async parse(value, policy = {}){
        if (typeof value != "string"){
            throw new Error("should_be_string");
        }
        if (!value){
            throw new Error("value_is_empty");
        }

        if (policy.min){
            if (value.length < policy.min){
                throw new Error("violates_min");
            }
        }

        if (policy.max){
            if (value.length > policy.max){
                throw new Error("violates_max");
            }
        }

        if (policy.sanitize){
            value = sanitize(value);
        }

        if (policy.character){
            if (policy.character === "katakana"){
                if (wanakana.isKana(value.replace(/(\s|　)/g, ""))){
                    value = wanakana.toKatakana(value);
                } else {
                    throw new Error("should_be_katakana");
                }
            } else if (policy.character === "hiragana"){
                if (wanakana.isKana(value.replace(/(\s|　)/g, ""))){
                    value = wanakana.toHiragana(value);
                } else {
                    throw new Error("should_be_hiragana");
                }
            } else if (policy.character === "kana"){
                if (!wanakana.isKana(value.replace(/(\s|　)/g, ""))){
                    throw new Error("should_be_kana");
                }
            }
        }

        if (Array.isArray(policy.exclude)){
            if (policy.exclude.includes(value)){
                throw new Error("violates_exclude");
            }
        }

        if (policy.regex){
            if (!value.match(policy.regex)){
                throw new Error("should_follow_regex");
            }
        }

        return value;
    }
}
