"use strict";

const debug = require("debug")("bot-express:parser")
const moment = require("moment")

module.exports = class ParserDatetime {
    /**
     * @constructor
     * @param {Object} [options]
     */
    constructor(options){
        this.type = "datetime"
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
     * @param {String} [policy.min] - Minimum date in format of YYYY-MM-DD HH:mm:ss or other format which can be parsed by moment.
     * @param {String} [policy.max] - Minimum date in format of YYYY-MM-DD HH:mm:ss or other format which can be parsed by moment.
     * @return {String} - Parsed value in format of YYYY-MM-DDTHH:mm
     */
    async parse(value, policy = {}){
        if (!value){
            throw new Error("be_parser__should_be_set")
        }

        let datetime
        // Extract value.
        if (typeof value === "string"){ 
            // Value may be string in case of postback of aux.
            datetime = value
        } else if (typeof value === "object"){
            if (value.params && value.params.datetime){
                datetime = value.params.datetime;
            } else if (value.data){
                datetime = value.data
            } else {
                throw new Error(`be_parser__invalid_value`);
            }
        }

        // Check format.
        if (!(datetime && datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/))){
            throw Error(`be_parser__should_be_yyyy_mm_dd_hh_mm`)
        }

        // Check with policy.
        if (policy.min){
            if (moment(datetime).isBefore(moment(policy.min))){
                throw Error(`be_parser__should_be_after_min_datetime`)
            }
        }
        if (policy.max){
            if (moment(datetime).isAfter(moment(policy.max))){
                throw Error(`be_parser__should_be_before_max_datetime`)
            }
        }

        return datetime
    }
}
