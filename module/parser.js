"use strict";

const debug = require("debug")("bot-express:parser");
const fs = require("fs");

/**
 * Parser abstraction class. *Context free.
 * @class
 */
class Parser {
    /**
     * @constructor
     * @param {Array.<Object>} options_list
     */
    constructor(options_list = []){
        const scripts = fs.readdirSync(__dirname + "/parser");

        for (let script of scripts){
            // Skip directory or other non-js file.
            if (!script.match(/.js$/)){
                continue;
            }

            // Set parser name.
            const parser = script.replace(".js", "");
            
            // Import parser implementation and identify corresponding options.
            debug("Loading parser implementaion: " + script + "...");
            let Parser_implementation= require("./parser/" + script);
            let options = options_list.find(options => options.type === script.replace(".js", ""));
            if (!options){
                options = {};
            }
           
            // Instantiate parser implementation.
            try {
                this[parser] = new Parser_implementation(options.options);
            } catch(e){
                debug(`Failed to instanticate parser implementation of "${parser}" so we skip this parser.`);
                if (e && e.message){
                    debug(e.message);
                }
                continue;
            }
        }
    }
}

module.exports = Parser;
