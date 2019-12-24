"use strict";

const debug = require("debug")("bot-express:memory")
const cache = require("memory-cache")

class MemoryRedis {
    /**
     * @constructor
     * @param {Object} options
     * @param {Object} options.redis_client - Client instance of ioredis.
     */
    constructor(o){
        if (o.redis_client){
            debug(`Redis client found in option.`)
            this.client = o.redis_client
        } else if (cache.get("redis_client")){
            debug(`Redis client found in cache.`)
            this.client = cache.get("redis_client")
        } else {
            throw Error(`options.redis_client not set and "redis_client" not found in cache while memory/redis is loaded.`)
        }
    }

    async get(key){
        const response = await this.client.get(key);

        if (!response) return;

        return JSON.parse(response, (key, value) => {
            // if value is Buffer, we return its data only.
            if (value && typeof value === "object" && value.type === "Buffer" && value.data){
                return Buffer.from(value.data);
            }
            return value;
        });

    }

    async put(key, context){
        if (context){
            context = JSON.stringify(context);
        }

        return this.client.set(key, context);
    }

    async del(key){
        await this.client.del(key);
    }

    /**
     * @deprecated
     */
    async close(){
        return this.client.quit();
    }
}

module.exports = MemoryRedis;
