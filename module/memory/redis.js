"use strict";

const debug = require("debug")("bot-express:memory");
const redis = require("redis");
Promise = require("bluebird");
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

class MemoryRedis {
    constructor(options){
        this.client = new redis.createClient(options);
    }

    get(key){
        return this.client.getAsync(key).then((response) => {
            if (response){
                return JSON.parse(response);
            } else {
                return response;
            }
        })
    }

    put(key, value, retention){
        if (value){
            value = JSON.stringify(value);
        }
        return this.client.setAsync(key, value, 'EX', retention);
    }

    del(key){
        return this.client.delAsync(key);
    }

    _replacer(k, v){
        if (typeof v === "function"){
            return v.toString()
        } else {
            return v;
        }
    }

    _reciever(k, v){
        if (typeof v === "string" && v.match(/^function/) ){
            return Function.call(this, "return "+ v)();
        } else {
            return v;
        }
    }
}

module.exports = MemoryRedis;
