"use strict";

const debug = require("debug")("bot-express:memory");
const redis = require("redis");
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

    close(){
        return this.client.quitAsync();
    }
}

module.exports = MemoryRedis;
