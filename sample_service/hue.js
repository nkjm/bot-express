"use strict";

require("dotenv").config();

const request = require('request');
const debug = require("debug")("bot-express:service");
const MAKER_URL_PREFIX = 'https://maker.ifttt.com/trigger/';
const MAKER_KEY = process.env.MAKER_KEY;
Promise = require('bluebird');
Promise.promisifyAll(request);

module.exports = class Hue {
    static change_color(color){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test" || process.env.BOT_EXPRESS_ENV == "development"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        debug("Going to change the color.");

        let url = MAKER_URL_PREFIX + 'wfc_change_light_color/with/key/' + MAKER_KEY;
        let body = {value1: color};
        return request.postAsync({
            url: url,
            body: body,
            json: true
        });
    }

    static turn_on(){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test" || process.env.BOT_EXPRESS_ENV == "development"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        debug("Going to turn on the light.");

        let url = MAKER_URL_PREFIX + 'wfc_turn_on_light/with/key/' + MAKER_KEY;
        return request.postAsync({
            url: url,
            json: true
        });
    }

    static turn_off(){
        // If this is test, we will not actually issue call out.
        if (process.env.BOT_EXPRESS_ENV == "test" || process.env.BOT_EXPRESS_ENV == "development"){
            debug("This is test so we skip the actual call out.");
            return Promise.resolve();
        }

        debug("Going to turn off the light.");

        let url = MAKER_URL_PREFIX + 'wfc_turn_off_light/with/key/' + MAKER_KEY;
        return request.postAsync({
            url: url,
            json: true
        });
    }
}
