"use strict";

const debug = require("debug")("bot-express:memory")
const cache = require("memory-cache")

class MemoryRedis {
    /**
     * @constructor
     * @param {Object} options
     * @param {Object} options.redis_client - Client instance of ioredis.
     * @param {Number} options.retention - Retention in seconds.
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

        this.retention = o.retention || 7200
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
    async put_if_absent(key, value, expire) {
        return this.client.set(key, value, "EX", expire, "NX");
    }

    async put(key, context){
        if (context){
            context = JSON.stringify(context);
        }

        // While retention is managed by memory-cache timer in parent class, we need to set retention to purge ghoast data just in case instance restart and timer does not work.
        return this.client.set(key, context, "EX", this.retention)
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
