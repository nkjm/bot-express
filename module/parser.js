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
        this.parsers = [];

        let scripts = fs.readdirSync(__dirname + "/parser");

        for (let script of scripts){
            if (!script.match(/.js$/)){
                // Skip directory or other non-js file.
                continue;
            }
            
            debug("Loading parser implementaion: " + script + "...");
            let Parser_implementation= require("./parser/" + script);
            let options = options_list.find(options => options.type === script.replace(".js", ""));
            if (!options){
                options = {};
            }
            
            try {
                let parser = new Parser_implementation(options.options);
                this.parsers.push(parser);
            } catch(e){
                debug(`Failed to instanticate parser implementation: ${script} so we skip this parser.`);
                if (e && e.message){
                    debug(e.message);
                }
                continue;
            }
            debug(`Builtin parser: ${script} loaded.`);
        }
    }

    /**
     * @method parse
     * @param {String} parser_type - Name of the builtin parser. Need to exist ${parser}.js under module/parser directory.
     * @param {Object} param
     * @param {String} param.key
     * @param {String} param.value
     * @param {Object} policy - Policy configuration depending on the implementation of each parser.
     */
    async parse(parser_type, param, policy){
        if (!param || !param.key){
            throw new Error("param.key is required.");
        }

        let parser = this.parsers.find(parser => parser.type === parser_type);
        return parser.parse(param, policy);
    }
}

module.exports = Parser;
