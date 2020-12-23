"use strict";

const debug = require(`bot-express:logger`)
const memory_cache = require("memory-cache")
const Context = require("../context")

module.exports = class LoggerSalesforce {
    /**
     * @constructor 
     * @param {Object} options 
     */
    constructor(options){
    }

    _get_conn(channel_id){
        const jsforce_conn_list = memory_cache.get("jsforce_connection_list")

        if (!Array.isArray(jsforce_conn_list)){
            debug(`jsforce_connection_list not found.`)
            return
        }

        const conn = jsforce_conn_list.find(conn => conn.channel_id === channel_id)
        if (!conn){
            debug(`jsforce_connection for channel: ${channel_id} not found.`)
            return
        }

        return conn.jsforce_connection
    }

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
    async skill_status(channel_id, user_id, chat_id, skill, status, payload){
        const skill_status = {
            govtech__channel_id__c: channel_id,
            govtech__user_id__c: user_id,
            govtech__chat_id__c: chat_id,
            govtech__skill__c: skill,
            govtech__status__c: status
        }

        if (status === "launched"){
            // No additional information.
        } else if (status === "aborted"){
            // Add error and context.
            if (payload.context) skill_status.govtech__context__c = JSON.parse(JSON.stringify(payload.context))
        } else if (status === "abended"){
            // Add error and context.
            if (payload.error){
                skill_status.govtech__error_line_number__c = payload.error.lineNumber
                skill_status.govtech__error_file_name__c = payload.error.fileName
                skill_status.govtech__error_message__c = (payload.error.message) ? JSON.stringify(payload.error.message) : null
                skill_status.govtech__error_name__c = payload.error.name
                skill_status.govtech__error_stack__c = payload.error.stack
            }
            if (payload.context) skill_status.govtech__context__c = Context.remove_buffer(payload.context)
        } else if (status === "switched"){
            // Add next intent and confirming.
            if (payload.intent && payload.intent.name) skill_status.govtech__intent__c = payload.intent.name
            if (payload.context && payload.context.confirming) skill_status.govtech__confirming__c = payload.context.confirming
        } else if (status === "restarted"){
            // Add confirming.
            if (payload.context && payload.context.confirming) skill_status.govtech__confirming__c = payload.context.confirming
        } else if (status === "completed"){
            // Add ttc (Time to complete).
            if (payload.context && payload.context.launched_at) skill_status.govtech__ttc__c = new Date().getTime() - payload.context.launched_at
        }

        // Get jsforce connection.
        const conn = this._get_conn(channel_id)
        if (!conn){
            debug(`jsforce connection not found. We could not save skill log to salesforce.`)
            return
        }

        await conn.sobject(`govtech__skill_status_log__c`).create(skill_status)
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
    async chat(channel_id, user_id, chat_id, skill, who, message){
        const chat = {
            govtech__channel_id__c: channel_id,
            govtech__user_id__c: user_id,
            govtech__chat_id__c: chat_id,
            govtech__skill__c: skill,
            govtech__who__c: who,
            govtech__message__c: message.text || message.altText || message
        }

        // Get jsforce connection.
        const conn = this._get_conn(channel_id)
        if (!conn){
            debug(`jsforce connection not found. We could not save skill log to salesforce.`)
            return
        }

        await conn.sobject(`govtech__chat_log__c`).create(chat)
    }
}

