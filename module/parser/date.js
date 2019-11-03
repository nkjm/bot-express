"use strict";

const debug = require("debug")("bot-express:parser")
const moment = require("moment")

module.exports = class ParserDate {
    /**
     * @constructor
     * @param {Object} [options]
     */
    constructor(options){
        this.type = "date"
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
     * @param {String} [policy.min] - Minimum date in format of YYYY-MM-DD
     * @param {String} [policy.max] - Minimum date in format of YYYY-MM-DD
     * @return {String} - Parsed value in format of YYYY-MM-DD
     */
    async parse(value, policy = {}){
        if (!value){
            throw new Error("be_parser__should_be_set")
        }

        let date
        // Extract value.
        if (typeof value === "string"){ 
            // Value may be string in case of postback of aux.
            date = value
        } else if (typeof value === "object"){
            if (value.params && value.params.date){
                date = value.params.date;
            } else if (value.data){
                date = value.data
            } else {
                throw new Error(`be_parser__invalid_value`);
            }
        }

        // Check format.
        if (!(date && date.match(/^\d{4}-\d{2}-\d{2}$/))){
            throw Error(`be_parser__should_be_yyyy_mm_dd`)
        }

        // Check with policy.
        if (policy.min){
            if (!(policy.min.match(/^\d{4}-\d{2}-\d{2}$/))){
                debug(`policy.min should be YYYY-MM-DD.`)
                throw Error()
            }
            if (moment(date).isBefore(policy.min)){
                throw Error(`be_parser__should_be_after_min_date`)
            }
        }
        if (policy.max){
            if (!(policy.max.match(/^\d{4}-\d{2}-\d{2}$/))){
                debug(`policy.max should be YYYY-MM-DD.`)
                throw Error()
            }
            if (moment(date).isAfter(policy.max)){
                throw Error(`be_parser__should_be_before_max_date`)
            }
        }

        return date
    }
}
