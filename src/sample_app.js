"use strict";

require("dotenv").config();

/** 
 * Import Packages
 */
const debug = require("debug")("bot-express:index")
const server = require("express")()
const bot_express = require("./index.js")
const Redis = require("ioredis")
const cache = require("memory-cache")

/** 
 * Middleware Configuration
 */
server.listen(process.env.PORT || 5000, () => {
    console.log("server is running...");
});

/**
 * Instantiate redis client
 */
let redis_client
if (process.env.REDIS_URL){
    debug("Instantiating redis client..")
    const options = {}
    if (process.env.REDIS_TLS === true || process.env.REDIS_TLS === "enable"){
        options.tls = {
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        }
    }
    redis_client = new Redis(process.env.REDIS_URL, options)
    debug("Redis client created.")
}

server.use('/bot/webhook', bot_express({
    language: "ja",
    messenger: {
        line: [{
            channel_id: process.env.LINE_CHANNEL_ID,
            channel_secret: process.env.LINE_CHANNEL_SECRET,
            token_retention: process.env.LINE_TOKEN_RETENTION,
            token_store: process.env.LINE_TOKEN_STORE || "redis",
            redis_client: redis_client
        }],
        facebook: {
            app_secret: process.env.FACEBOOK_APP_SECRET,
            page_access_token: [
                {page_id: process.env.FACEBOOK_PAGE_ID, page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN}
            ],
        },
        google: {
            project_id: process.env.GOOGLE_PROJECT_ID
        }
    },
    reaction: {
        path: "reaction"
    },
    // nlu: {
    //     type: "dialogflow",
    //     options: {
    //         project_id: process.env.GOOGLE_PROJECT_ID,
    //         client_email: process.env.GOOGLE_CLIENT_EMAIL,
    //         private_key: process.env.GOOGLE_PRIVATE_KEY,
    //         language: "ja"
    //     }
    // },
    // parser: [{
    //     type: "dialogflow",
    //     options: {
    //         project_id: process.env.GOOGLE_PROJECT_ID,
    //         client_email: process.env.GOOGLE_CLIENT_EMAIL,
    //         private_key: process.env.GOOGLE_PRIVATE_KEY,
    //         language: "ja"
    //     }
    // }],
    memory: {
        type: process.env.MEMORY_TYPE, // memory-cache | redis 
        retention: Number(process.env.MEMORY_RETENTION),
        options: { // Options for redis
            redis_client: redis_client,
        }
    },
    logger: {
        type: "stdout", // stdout | firestore
        options: { // Options for firestore.
            // instance: firestore
            project_id: process.env.GOOGLE_PROJECT_ID,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY,
        }
    },
    translator: {
        type: "google",
        enable_lang_detection: false,
        enable_translation: false,
    },
    skill: {
        beacon: {
            enter: "survey",
            leave: "bye"
        },
        follow: "say-welcome",
        unfollow: "clear-context",
        join: "say-welcome",
        leave: "clear-context"
    },
    modify_previous_parameter_intent: "modify-previous-parameter"
}));

module.exports = server;
