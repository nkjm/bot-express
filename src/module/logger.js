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
   * @param {String} logger_path - Path to logger directory.
   * @param {Object} options
   * @param {String} options.type - Logger type. Supported stores are located in logger directory.
   * @param {Array.<String>} [options.exclude] - Log to exclude. Supported values are "skill-status" and "chat".
   * @param {Object} [options.options] - Options depending on the logger.
   */
  constructor(logger_path, options = {}) {
    this.exclude = options.exclude || [];
    options.type = options.type || default_logger;

    debug(`Look for ${options.type} logger.`);
    try {
      require.resolve(`${logger_path}${options.type}`);
      debug(`Found plugin for specified logger. Loading ${options.type}..`);
      const Logger = require(`${logger_path}${options.type}`);
      this.logger = new Logger(options.options);
    } catch (e) {
      debug(`Logger: "${options.type}" not found.`);
    }

    if (!this.logger) {
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
  async skill_status(
    channel_id,
    user_id,
    chat_id,
    skill,
    status,
    payload = {}
  ) {
    // Disable logging if skill-status is excluded by option.
    if (this.exclude.includes("skill-status")) return;

    await this.logger.skill_status(
      channel_id,
      user_id,
      chat_id,
      skill,
      status,
      payload
    );
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
  async chat(channel_id, user_id, chat_id, skill, who, message) {
    // Disable logging if chat is excluded by option.
    if (this.exclude.includes("chat")) return;

    await this.logger.chat(channel_id, user_id, chat_id, skill, who, message);
  }
};
