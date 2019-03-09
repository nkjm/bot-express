"use strict";

const debug = require("debug")("bot-express:logger");
const fs = require("fs");
const default_logger = "stdout";

module.exports = class Logger {
    /**
     * @constructor
     * @param {Object} options
     * @param {String} options.type - Logger type. Supported stores are located in logger directory.
     * @param {Object} options.options - Options depending on the logger.
     */
    constructor(options = {}){
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
     * @param {String} user_id
     * @param {String} chat_id
     * @param {String} skill
     * @param {String} status - "launched" | "aborted" | "switched" | "restarted" | "completed" | "abended"
     * @param {Object} [payload]
     */
    async skill_status(user_id, chat_id, skill, status, payload = {}){
        await this.logger.skill_status(user_id, chat_id, skill, status, payload);
    }

    /**
     * @method
     * @param {String} user_id
     * @param {String} chat_id
     * @param {String} skill
     * @param {String} who
     * @param {Object} message
     */
    async chat(user_id, chat_id, skill, who, message){
        await this.logger.chat(user_id, chat_id, skill, who, message);
    }
}
