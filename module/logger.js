"use strict";

const _skill_status = require("debug")("bot-express:skill-status");
const _chat = require("debug")("bot-express:chat");

class Logger {
    /**
    @method
    @param {String} user_id
    @param {String} skill
    @param {String} status - "launched" | "aborted" | "completed" | "abend"
    @param {String} [confirming] - Only valid in case of "aborted" or "abend" status
    */
    static skill_status(user_id, skill, status, confirming = null){
        if ((status === "aborted" || status === "abend") && confirming){
            _skill_status(`${user_id} ${skill} - ${status} in confirming ${confirming}`);
        } else {
            _skill_status(`${user_id} ${skill} - ${status}`);
        }
    }

    /**
    @method
    @param {String} user_id
    @param {String} skill
    @param {String} who
    @param {Object} message
    */
    static chat(user_id, skill, who, message){
        let message_text

        if (message.text){
            message_text = message.text;
        } else if (message.altText){
            message_text = message.altText;
        } else {
            message_text = JSON.stringify(message);
        }
        
        _chat(`${user_id} ${skill} - ${who} says ${message_text}`);
    }
}

module.exports = Logger;
