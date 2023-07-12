"use strict";

const debug = require("debug")("bot-express:logger");
const fs = require("fs");
const default_logger = "stdout";

/**
 * Logger class. *Context free
 */
module.exports = class Logger {
    /**
     * @constructor
     * @param {Object} options
     * @param {String} options.type - Logger type. Supported stores are located in logger directory.
     * @param {Array.<String>} [options.exclude] - Log to exclude. Supported values are "skill-status" and "chat".
     * @param {Object} [options.options] - Options depending on the logger.
     */
    constructor(options = {}){
        this.exclude = options.exclude || [];
        options.type = options.type || default_logger;

        let script_list = fs.readdirSync(__dirname + "/logger");
        for (let script of script_list){
            if (script.replace(".js", "") == options.type){
                debug(`Found plugin for specified logger. Loading ${options.type}..`);
                const Logger = require("./logger/" + options.type);
                this.logger = new Logger(options.options);
            }
        }

        if (!this.logger){
            throw new Error(`Specified logger "${options.type}" is not supported.`);
        }
    }

    /**
     * @method
     * @async
     * @param {String} channel_id
     * @param {String} user_id
     * @param {String} chat_id
     * @param {String} skill
     * @param {String} status - "launched" | "aborted" | "switched" | "restarted" | "completed" | "abended"
     * @param {Object} [payload]
     */
    async skill_status(channel_id, user_id, chat_id, skill, status, payload = {}){
        // Disable logging if skill-status is exlucded by option.
        if (this.exclude.includes("skill-status")) return;

        await this.logger.skill_status(channel_id, user_id, chat_id, skill, status, payload);
    }

    /**
     * @method
     * @param {String} channel_id
     * @param {String} user_id
     * @param {String} chat_id
     * @param {String} skill
     * @param {String} who
     * @param {Object} message
     */
    async chat(channel_id, user_id, chat_id, skill, who, message){
        // Disable logging if chat is exlucded by option.
        if (this.exclude.includes("chat")) return;

        await this.logger.chat(channel_id, user_id, chat_id, skill, who, message);
    }
}
