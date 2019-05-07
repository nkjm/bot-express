"use strict";

const debug = require("debug")("bot-express:memory");
const Redis = require("ioredis");

class MemoryRedis {
    /**
     * @constructor
     * @param {Object} options
     * @param {String} [options.url] - The URL of the Redis server. Format: [redis[s]:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]] *Either url or host and port is required.
     * @param {String} [options.host] - IP address of the Redis server. *Either url or host and port is required.
     * @param {String} [options.port] - Port of the Redis server. *Either url or host and port is required.
     * @param {String} [options.password] - If set, client will run Redis auth command on connect.
     * @param {String} [options.tls] - If "enable", client will connect to server over TLS.
     */
    constructor(options){
        const o = JSON.parse(JSON.stringify(options));

        if (o.tls){
            o.rejectUnauthorized = false;
            o.requestCert = true;
            o.agent = false;
        }

        this.client = new Redis(o);
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
