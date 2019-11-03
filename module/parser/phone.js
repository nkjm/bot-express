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
     * @param {String} [policy.length=40] - Maximum length excluding dash.
     * @return {String}
     */
    async parse(value, policy = {}){
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

        // Check with policy.
        if (phone.length > policy.length){
            throw Error(`be_parser__too_long`)
        }

        return phone
    }
}
