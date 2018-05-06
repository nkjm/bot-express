"use strict";

const debug = require("debug")("bot-express:parser");
const fs = require("fs");

/**
* Parser abstraction class
* @class
*/
class Parser {

    /**
    @constructor
    @param {Array.<Object>} options_list
    */
    constructor(options_list = []){
        this._parsers = [];

        for (let options of options_list){
            if (!options.type) throw new Error(`Type of the parser not set.`);

            if (!options.type.match(/^[a-z\d-]+$/i)) throw new Error(`Type of the parser: ${options.type} is invalid.`);

            try {
                this._parsers.push({
                    type: options.type,
                    options: options.options,
                    parser: require(`./parser/${options.type}`)
                });
                debug(`Builtin parser: ${options.type} loaded.`);
            } catch(e) {
                throw new Error(`Spedified parser type: ${options.type} not found under parser directory or could not import.`);
            }
        }
    }

    /**
    @method parse
    @param {String} parser - Name of the builtin parser. Need to exist ${parser}.js under module/parser directory.
    @param {Object} param
    @param {String} param.key
    @param {String} param.value
    @param {Object} bot
    @param {Object} event
    @param {Object} context
    @param {Function} resolve
    @param {Function} reject
    */
    parse(parser, param, bot, event, context, resolve, reject){
        let builtin_parser = this._parsers.find(builtin_parser => builtin_parser.type === parser);
        return builtin_parser.parser(builtin_parser.options, param, bot, event, context, resolve, reject);
    }
}

module.exports = Parser;
