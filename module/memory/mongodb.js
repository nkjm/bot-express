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
            return this.db.collection('bot-express').findOne({context_id: key}).then((response) => {
                return resolve(response);
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    put(key, value, retention){
        return this.connected.then((response) => {
            value.context_id = key;
            return this.db.collection('bot-express').insertOne(value).then((response) => {
                assert.equal(1, response.insertedCount);
                return resolve();
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    del(key){
        return this.connected.then((response) => {
            return this.db.collection('bot-express').deleteOne({context_id: key}).then((response) => {
                assert.equal(null, err);
                return resolve();
            }).catch((error) => {
                return reject(error);
            });
        });
    }
}

module.exports = MemoryMongodb;
