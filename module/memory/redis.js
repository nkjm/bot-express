"use strict";

const debug = require("debug")("bot-express:memory");
const redis = require("redis");
const log = require("../logger");
const prefix = "botex_context_";
const Promise = require("bluebird");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

class MemoryRedis {
    /**
    @constructor
    @param {Object} options
    @param {String} [options.url] - The URL of the Redis server. Format: [redis[s]:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]] *Either url or host and port is required.
    @param {String} [options.host] - IP address of the Redis server. *Either url or host and port is required.
    @param {String} [options.port] - Port of the Redis server. *Either url or host and port is required.
    @param {String} [options.password] - If set, client will run Redis auth command on connect.
    */
    constructor(options){
        this.client = redis.createClient(options);
        this.sub = redis.createClient(options);

        this.sub.on("pmessage", async (pattern, channel, key) => {
            const value = await this.get(`${key}_cloned`);
            if (value.confirming && value.skill){
                log.skill_status(key.replace(prefix, ""), value.skill.type, "aborted", value.confirming);
            }

            await this.del(`${key}_cloned`);
        })

        this.sub.psubscribe("__key*__:expired");
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

    async put(key, value, retention){
        if (value){
            value = JSON.stringify(value);
        }

        // We clone this record for skill-status log.
        await this.client.setAsync(`${key}_cloned`, value);

        return this.client.setAsync(key, value, 'EX', retention);
    }

    async del(key){
        return this.client.delAsync(key);
    }

    /**
    @deprecated
    */
    async close(){
        return this.client.quitAsync();
    }
}

module.exports = MemoryRedis;
