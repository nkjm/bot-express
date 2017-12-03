"use strict";

const MongoClient = require("mongodb").MongoClient;
const debug = require("debug")("bot-express:memory");
const assert = require('assert');
Promise = require("bluebird");

class MemoryMongodb {
    constructor(options){
        this.url = options.url;
        this.connected = MongoClient.connect(this.url, {promiseLibrary: Promise}).then((response) => {
            this.db = response;
        });
    }

    get(key){
        return this.connected.then((response) => {
            return this.db.collection('bot-express').findOne({_id: key}).then((response) => {
                return response;
            }).catch((error) => {
                return Promise.reject(error);
            });
        });
    }

    put(key, value, retention){
        return this.connected.then((response) => {
            value._id = key;

            return this.db.collection('bot-express').updateOne({_id:key}, value, {upsert:true}).then((response) => {
                assert.equal(1, response.insertedCount);
                return;
            }).catch((error) => {
                return Promise.reject(error);
            });
        });
    }

    del(key){
        return this.connected.then((response) => {
            return this.db.collection('bot-express').deleteOne({_id: key});
        });
    }
}

module.exports = MemoryMongodb;
