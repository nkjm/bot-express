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
        /*
        this.keyspace_notification = options.keyspace_notification;

        if (this.keyspace_notification){
            this.sub = redis.createClient(options);

            this.sub.on("pmessage", async (pattern, channel, key) => {
                const context = await this.get(`${key}_cloned`);
                if (context.confirming && context.skill){
                    // Log skill-status
                    await this.logger.skill_status(key.replace(prefix, ""), context.chat_id, context.skill.type, "aborted", {
                        context:context 
                    });

                    // Run on_abort function.
                }

                await this.del(`${key}_cloned`);
            })

            this.sub.psubscribe("__key*__:expired");
        }
        */
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

    /*
    async put(key, context, retention){
        if (context){
            context = JSON.stringify(context);
        }

        // We clone this record for skill-status log.
        if (this.keyspace_notification){
            await this.client.setAsync(`${key}_cloned`, context);
        }

        return this.client.setAsync(key, context, 'EX', retention);
    }
    */

    async del(key){
        await this.client.delAsync(key);

        // Delete clone as well if keyspace notification is set.
        /*
        if (this.keyspace_notification){
            await this.client.delAsync(`${key}_cloned`);
        }
        */
    }

    /**
    @deprecated
    */
    async close(){
        return this.client.quitAsync();
    }
}

module.exports = MemoryRedis;
