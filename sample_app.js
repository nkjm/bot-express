"use strict";

require("dotenv").config();

/*
** Import Packages
*/
const server = require("express")();
const bot_express = require("./index.js");

/*
** Middleware Configuration
*/
server.listen(process.env.PORT || 5000, () => {
    console.log("server is running...");
});

server.use('/webhook', bot_express({
    language: "ja",
    nlu: {
        type: "dialogflow",
        options: {
            project_id: process.env.GOOGLE_PROJECT_ID,
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY,
            language: "ja"
        }
    },
    parser: [{
        type: "dialogflow",
        options: {
            project_id: process.env.GOOGLE_PROJECT_ID,
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY,
            language: "ja"
        }
    }],
    translator: {
        type: "google",
        enable_lang_detection: true,
        options: {
            project_id: process.env.GOOGLE_PROJECT_ID,
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY
        }
    },
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    line_access_token: process.env.LINE_ACCESS_TOKEN,
    facebook_app_secret: process.env.FACEBOOK_APP_SECRET,
    facebook_page_access_token: [
        {page_id: process.env.FACEBOOK_PAGE_ID, page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN}
    ],
    memory: {
        type: process.env.MEMORY_TYPE, // memory-cache | redis | mongodb
        retention: Number(process.env.MEMORY_RETENTION),
        // redis
        options: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        }
        // mongodb
        /*
        options: {
            url: process.env.MONGODB_URL
        }
        */
    },
    beacon_skill: {
        enter: "survey",
        leave: "bye"
    },
    follow_skill: "say-welcome",
    unfollow_skill: "clear-context",
    join_skill: "say-welcome",
    leave_skill: "clear-context",
    modify_previous_parameter_intent: "modify-previous-parameter"
}));

module.exports = server;
