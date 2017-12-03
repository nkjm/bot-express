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
        return this.client.getAsync(key);
    }

    put(key, value, retention){
        return this.client.setAsync(key, value, 'EX', retention);
    }

    del(key){
        return this.client.delAsync(key);
    }
}

module.exports = MemoryRedis;
