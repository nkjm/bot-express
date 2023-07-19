"use strict";

const MongoClient = require("mongodb").MongoClient;
const debug = require("debug")("bot-express:memory");

/**
 * @deprecated
 */
class MemoryMongodb {
    constructor(options){
        this.url = options.url;
        this.connected = MongoClient.connect(this.url, {promiseLibrary: Promise}).then((response) => {
            this.db = response;
        });
    }

    async get(key){
        return this.connected.then((response) => {
            return this.db.collection('bot-express').findOne({_id: key});
        });
    }

    async put(key, value){
        return this.connected.then((response) => {
            value._id = key;
            return this.db.collection('bot-express').updateOne({_id:key}, value, {upsert:true});
        });
    }

    async del(key){
        return this.connected.then((response) => {
            return this.db.collection('bot-express').deleteOne({_id: key});
        });
    }
}

module.exports = MemoryMongodb;
