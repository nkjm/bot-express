"use strict";

const debug = require("debug")("bot-express:parser")
const moment = require("moment")

module.exports = class ParserPhone {
    /**
     * @constructor
     * @param {Object} [options]
     */
    constructor(options){
        this.type = "phone"
        this.required_options = []

        for (let required_option of this.required_options){
            if (!options[required_option]){
                throw new Error(`Required option "${required_option}" not set.`)
            }
        }
    }

    /**
     * @method
     * @param {*} value
     * @param {Object} [policy]
     * @param {Number} [policy.min]
     * @param {Number} [policy.max]
     * @param {Number} [policy.length] - Deprecated. Just for backward compatibility. Should use max instead.
     * @param {Boolean} [policy.required=true] - Set false to accept empty value.
     * @return {String}
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

        policy.length = (policy.length === undefined) ? 40 : policy.length

        if (typeof policy.length !== "number"){
            debug(`policy.length should be number.`)
            throw Error()
        } 
        if (typeof value !== "string"){
            throw Error("be_parser__should_be_string")
        }

        // Extract value removing "-".
        const phone = value.replace(/[\B-]/g, "")

        // Check format.
        if (!phone.match(/^[0-9]+$/)){
            throw Error("be_parser__should_be_number_and_dash")
        }

        // Check min length.
        if (policy.min){
            if (phone.length < policy.min){
                throw new Error("be_parser__too_short")
            }
        }

        // Check max length.
        if (policy.max || policy.length){
            const max = policy.max || policy.length
            if (phone.length > max){
                throw new Error("be_parser__too_long")
            }
        }

        return phone
    }
}
