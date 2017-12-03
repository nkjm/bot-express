"use strict";

const debug = require("debug")("bot-express:memory");
const default_store = "memory-cache";
const fs = require("fs");
Promise = require("bluebird");

/**
* Memory to store context.
* @class
*/
class Memory {

    /**
    * @constructor
    * @param {Object} options
    * @param {String} options.store - Store to use. Available stores are located in memory directory.
    * @param {Number} options.retention - Lifetime of the context in seconds.
    * @param {Object} options.options - Options depending on the memory store.
    */
    constructor(options){
        this.retention = options.retention || 600;

        if (!options.store) options.store = default_store;

        let supported_store_list = fs.readdirSync(__dirname + "/memory");
        for (let store of supported_store_list){
            if (store == options.store){
                debug("Found plugin for specified memory store. Loading " + store + "...");
            }

            store = store.replace(".js", "");
            let Store = require("./memory/" + store);
            this.store = new Store(options.options);
        }

        if (!this.store){
            throw new Error("Specified store type is not supported for Memory.");
        }
    }

    /**
    Get the context by key.
    @function
    @param {String} key - Key of the context.
    @returns {context} context - Context object.
    */
    get(key){
        return this.store.get(key);
    }

    /**
    Put the context by key.
    @function
    @param {String} key - Key of the context.
    @param {context} context - Context object to store.
    @param {Number} retention - Lifetime of the context in seconds.
    @returns null
    */
    put(key, context, retention = this.retention){
        return this.store.put(key, context, retention);
    }

    /**
    Delete the context by key.
    @function
    @param {String} key - Key of the context.
    @returns null
    */
    del(key){
        return this.store.del(key);
    }
}

module.exports = Memory;
