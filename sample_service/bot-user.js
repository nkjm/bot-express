'use strict';

const request = require('request');
const debug = require("debug")("bot-express:service");
const BOT_ID = process.env.BOT_ID;
const URL_BASE = `https://apex.oracle.com/pls/apex/${process.env.ORACLE_WORKSPACE}/bot/${process.env.ORACLE_ACCESS_TOKEN}/${BOT_ID}`;
Promise = require('bluebird');
Promise.promisifyAll(request);

module.exports = class ServiceBotUser {

    static get_list(){
        let url = URL_BASE + `/user/list`;
        let headers = {
            "Content-Type": "application/json"
        };
        return request.getAsync({
            url: url,
            headers: headers,
            json: true
        }).then(
            (response) => {
                if (response.statusCode != 200){
                    return Promise.reject(new Error("ServiceBotUser.get_list() failed."));
                }
                return response.body.items;
            }
        );
    }

    static save(user){
        let url = URL_BASE + `/user`;
        return request.postAsync({
            url: url,
            body: user,
            json: true
        }).then(
            (response) => {
                if (response.statusCode != 200){
                    return Promise.reject(new Error("ServiceBotUser.save() failed."));
                }
                return;
            }
        );
    }

    static delete(user_id){
        let url = URL_BASE + `/user/${user_id}`;
        return request.delAsync({
            url: url,
            json: true
        }).then(
            (response) => {
                if (response.statusCode != 200){
                    return Promise.reject(new Error("ServiceBotUser.delete() failed."));
                }
                return;
            }
        );
    }
}
