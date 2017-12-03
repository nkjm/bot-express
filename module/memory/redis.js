"use strict";

const debug = require("debug")("bot-express:memory");
const redis = require("redis");
Promise = require("bluebird");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

class MemoryRedis {
    constructor(options){
        this.client = redis.createClient(options);
    }

    get(key){
        return this.client.getAsync(key).then((response) => {
            return JSON.parse(response);
        })
    }

    put(key, value, retention){
        return this.client.setAsync(key, JSON.stringify(value), 'EX', retention);
    }

    del(key){
        return this.client.delAsync(key);
    }
}

module.exports = MemoryRedis;
