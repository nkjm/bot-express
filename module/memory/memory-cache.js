"use strict";

const memory_cache = require("memory-cache");
const debug = require("debug")("bot-express:memory");
const log = require("../logger");
const prefix = "botex_context_";

class MemoryMemoryCache {
    constructor(options){
        this.client = memory_cache;
    }

    async get(key){
        return this.client.get(key);
    }

    async put(key, value, retention){
        return this.client.put(key, value, retention * 1000, (key, value) => {
            if (value.confirming && value.skill){
                // Log skill status.
                log.skill_status(key.replace(prefix, ""), value.skill.type, "aborted", value.confirming);
            }
        });
    }

    async del(key){
        return this.client.del(key);
    }

    /**
    @deprecated
    */
    async close(){
        // memory-cache does not have to close connection so this is dummy.
        return;
    }
}

module.exports = MemoryMemoryCache;
