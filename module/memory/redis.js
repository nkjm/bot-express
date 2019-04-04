"use strict";

const debug = require("debug")("bot-express:memory");
const redis = require("redis");
const Promise = require("bluebird");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

class MemoryRedis {
    /**
     * @constructor
     * @param {Object} options
     * @param {String} [options.url] - The URL of the Redis server. Format: [redis[s]:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]] *Either url or host and port is required.
     * @param {String} [options.host] - IP address of the Redis server. *Either url or host and port is required.
     * @param {String} [options.port] - Port of the Redis server. *Either url or host and port is required.
     * @param {String} [options.password] - If set, client will run Redis auth command on connect.
     * @param {boolean} [options.keyspace_notification=false] - If true, we duplicates context to detect skill abort and log it.
     */
    constructor(options){
        this.client = redis.createClient(options);
    }

    async get(key){
        const response = await this.client.getAsync(key);

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

        return this.client.setAsync(key, context);
    }

    async del(key){
        await this.client.delAsync(key);
    }

    /**
     * @deprecated
     */
    async close(){
        return this.client.quitAsync();
    }
}

module.exports = MemoryRedis;
