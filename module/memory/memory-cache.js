"use strict";

const memory_cache = require("memory-cache");
Promise = require("bluebird");
Promise.promisifyAll(memory_cache);

class MemoryMemoryCache {
    constructor(options){
        this.client = memory_cache;
    }

    get(key){
        return this.client.getAsync(key);
    }

    put(key, value, retention){
        return this.client.putAsync(key, value, retention * 1000);
    }

    del(key){
        return this.client.delAsync(key);
    }
}

module.exports = MemoryMemoryCache;
