"use strict";

const MongoClient = require("mongodb").MongoClient;
const debug = require("debug")("bot-express:memory");
const assert = require('assert');
Promise = require("bluebird");

class MemoryMongodb {
    constructor(options){
        this.url = options.url;
    }

    get(key){
        return new Promise((resolve, reject) => {
            return MongoClient.connect(this.url, function(err, db) {
                assert.equal(null, err);
                debug("Connected successfully to MongoDB server");

                return db.collection('bot-express').findOne({context_id: key}).then((response) => {
                    debug(response);
                    return resolve(response);
                }).catch((error) => {
                    return reject(error);
                });
            });
        });
    }

    put(key, value, retention){
        return new Promise((resolve, reject) => {
            return MongoClient.connect(this.url, function(err, db) {
                assert.equal(null, err);
                debug("Connected successfully to MongoDB server");

                value.context_id = key;
                return db.collection('bot-express').insertOne(value).then((response) => {
                    assert.equal(1, response.insertedCount);
                    return resolve();
                }).catch((error) => {
                    return reject(error);
                });
            });
        });
    }

    del(key){
        return new Promise((resolve, reject) => {
            return MongoClient.connect(this.url, function(err, db) {
                assert.equal(null, err);
                debug("Connected successfully to MongoDB server");

                return db.collection('bot-express').deleteOne({context_id: key}, function(err, r) {
                    try {
                        assert.equal(null, err);
                        return resolve();
                    } catch(e) {
                        return reject(e);
                    }
                });
            });
        });
    }
}

module.exports = MemoryMongodb;
