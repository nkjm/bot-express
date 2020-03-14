"use strict";

const prefix = `be`
const memory_cache = require("memory-cache")
const Context = require("../context")

module.exports = class LoggerFirestore {
    /**
     * @constructor 
     * @param {Object} options 
     * @param {Object} [instnce] - Firestore instance created by firebase_admin.firestore() of firebase admin sdk.
     * @param {String} [project_id] - Firebase project id.
     * @param {String} [client_email] - Firebase client email.
     * @param {String} [private_key] - Firebase private key.
     */
    constructor(options){
        // If options.instance is set, we just use the instance.
        if (options.instance){
            this.db = options.instance
            return
        }

        // If firestore instance is found in memory cache, we use it.
        this.db = memory_cache.get("firestore")
        if (this.db){
            return
        }

        // If options.instance is not set, we create new firestore instance.
        const firebase_admin = require("firebase-admin");
        const required_option_list = ["project_id", "client_email", "private_key"];

        // Check required options.
        for (let req_opt of required_option_list){
            if (options[req_opt] === undefined){
                throw new Error(`Required option "${req_opt}" for LoggerFirestore not set.`);
            }
        }

        const firebase_config = {
            credential: firebase_admin.credential.cert({
                projectId: options.project_id,
                clientEmail: options.client_email,
                privateKey: options.private_key.replace(/\\n/g, "\n")
            }),
            databaseURL: `https://${options.project_id}.firebaseio.com`,
            storageBucket: `${options.project_id}.appspot.com`,
            projectId: options.project_id
        }
        try {
            firebase_admin.initializeApp(firebase_config)
        } catch(e){
            if (e.code === "app/duplicate-app"){
                debug(`Default firebase app already exists so we create another one.`)
                firebase_admin.initializeApp(firebase_config, "bot-express")
            }
        }

        this.db = firebase_admin.firestore()
        memory_cache.put("firestore", this.db)
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
            channel_id: channel_id,
            user_id: user_id,
            chat_id: chat_id,
            skill: skill,
            status: status
        }

        if (status === "launched"){
            // No additional information.
        } else if (status === "aborted"){
            // Add error and context.
            if (payload.context) skill_status.context = JSON.parse(JSON.stringify(payload.context));
        } else if (status === "abended"){
            // Add error and context.
            if (payload.error) skill_status.error = {
                line_number: payload.error.lineNumber || null,
                file_name: payload.error.fileName || null,
                message: (payload.error.message) ? JSON.stringify(payload.error.message) : null,
                name: payload.error.name || null,
                stack: payload.error.stack || null
            }
            if (payload.context) skill_status.context = Context.remove_buffer(payload.context)
        } else if (status === "switched"){
            // Add next intent and confirming.
            if (payload.intent && payload.intent.name) skill_status.intent = payload.intent.name;
            if (payload.context && payload.context.confirming) skill_status.confirming = payload.context.confirming;
        } else if (status === "restarted"){
            // Add confirming.
            if (payload.context && payload.context.confirming) skill_status.confirming = payload.context.confirming;
        } else if (status === "completed"){
            // Add ttc (Time to complete).
            if (payload.context && payload.context.launched_at) skill_status.ttc = new Date().getTime() - payload.context.launched_at;
        }

        // Add timestamp.
        skill_status.created_at = new Date();

        await this._create(`${prefix}_skill_status`, skill_status);
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
            channel_id: channel_id,
            user_id: user_id,
            chat_id: chat_id,
            skill: skill,
            who: who,
            message: message.text || message.altText || message
        }

        // Add timestamp.
        chat.created_at = new Date();

        await this._create(`${prefix}_chat`, chat);
    }

    /**
     * Create item.
     * @param {String} collection
     * @param {*} item 
     * @param {String} [doc]
     * @return {String} Item id.
     */
    async _create(collection, item, doc){
        let doc_ref;
        if (doc){
            doc_ref = await this.db.collection(collection).doc(doc).set(item);
            return doc;
        } else {
            doc_ref = await this.db.collection(collection).add(item);
            if (!(doc_ref && doc_ref.id)){
                throw new Error("Failed to save data to firestore.");
            }
            return doc_ref.id;
        }
    }
}

