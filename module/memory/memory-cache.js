"use strict";

const memory_cache = require("memory-cache");
const debug = require("debug")("bot-express:memory");
const prefix = "botex_context_";

class MemoryMemoryCache {
    /**
     * @constructor
     * @param {Object} logger
     * @param {Object} options
     */
    constructor(logger, options){
        this.logger = logger;
        this.client = memory_cache;
    }

    async get(key){
        return this.client.get(key);
    }

    async put(key, value, retention){
        return this.client.put(key, value, retention * 1000, async (key, value) => {
            if (value.confirming && value.skill){
                // Log skill status.
                await this.logger.skill_status(key.replace(prefix, ""), value.chat_id, value.skill.type, "aborted", {
                    context: value
                });
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
