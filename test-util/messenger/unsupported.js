"use strict";

const debug = require("debug")("bot-express:test");

module.exports = class TestUtilMessengerUnsupported {
    /**
    @constructor
    @param {Object} options
    */
    constructor(){
    }

    create_body(){
        let body = {dummy:"dummy"}
        return body;
    }

    create_header(body){
        let header = {"X-Unsupported-Signature": "dummy"};
        return header;
    }

    create_unsupported_event(source){
        let event = {
            dummy: "dummy"
        }
        return event;
    }
}
