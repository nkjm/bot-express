"use strict";

const debug = require("debug")("bot-express:memory");
const redis = require("redis");
const flatten = require("flat");
const unflatten = flatten.unflatten;
Promise = require("bluebird");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

class MemoryRedis {
    constructor(options){
        this.client = new redis.createClient(options);
    }

    get(key){
        return this.client.getAsync(key).then((response) => {
            return unflatten(response);
        })
    }

    put(key, value, retention){
        return this.client.setAsync(key, flatten(value), 'EX', retention);
    }

    del(key){
        return this.client.delAsync(key);
    }
}

module.exports = MemoryRedis;
