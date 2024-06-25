"use strict";

module.exports = class LoggerTest {
  constructor() {}

  /**
   * @method
   * @async
   * @param {String} channel_id
   * @param {String} user_id
   * @param {String} chat_id
   * @param {String} skill
   * @param {String} status - "launched" | "aborted" | "switched" | "restarted" | "completed" | "abended"
   * @param {Object} payload
   */
  async skill_status(channel_id, user_id, chat_id, skill, status, payload) {
    // Nothing todo.
  }

  /**
   * @method
   * @async
   * @param {String} channel_id
   * @param {String} user_id
   * @param {String} chat_id
   * @param {String} skill
   * @param {String} who
   * @param {Object} message
   */
  async chat(channel_id, user_id, chat_id, skill, who, message) {
    // Nothing todo.
  }
};
