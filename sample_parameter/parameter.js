"use strict";

const debug = require("debug")("bot-express:parameter")

module.exports = class Parameter {
    constructor(){
    }

    /**
     * @method
     * @param {Object} [options]
     * @param {Object} [options.name="zip_code"]
     * @param {Function} [options.condition]
     * @param {Function} [options.reaction]
     * @param {String} [options.message_label]
     * @param {String} [options.message_text]
     * @param {Boolean} [options.modify_prev_param=true]
     * @param {Boolean} [options.aux=true]
     * @param
     */
    zip_code(o = {}){
        o.name = o.name || "zip_code"
        const param = {
            message: async (bot, event, context) => {
                let message = {
                    type: "text",
                    text: o.message_text
                }

                return message;
            },
            parser: async (value, bot, event, context) => {
                if (typeof value != "string"){
                    throw new Error("invalid_type");
                }
                let zip_code = value.replace(/[\B-]/g, "");
                if (!zip_code.match(/^[0-9]{7}$/)){
                    throw new Error("violates_regex");
                }
                return zip_code;
            },
        }
        if (o.condition) param.condition = o.condition
        if (o.reaction) param.reaction = o.reaction
        return param
    }

    /**
     * @method
     * @param {Object} [options]
     * @param {Object} [options.name="phone"]
     * @param {Function} [options.condition]
     * @param {Function} [options.reaction]
     * @param {String} [options.message_label]
     * @param {String} [options.message_text]
     * @param {Boolean} [options.modify_prev_param=true]
     * @param {Boolean} [options.aux=true]
     * @param
     */
    phone(o = {}){
        o.name = o.name || "phone"
        const param = {
            message: async (bot, event, context) => {
                let message = {
                    type: "text",
                    text: o.message_text
                }

                return message;
            },
            parser: async (value, bot, event, context) => {
                if (typeof value != "string"){
                    throw new Error("invalid_type");
                }
                let phone = value.replace(/[\B-]/g, "");
                if (!zip_code.match(/^[0-9]{11}$/)){
                    throw new Error("violates_regex");
                }
                return phone;
            },
        }
        if (o.condition) param.condition = o.condition
        if (o.reaction) param.reaction = o.reaction
        return param
    }
}