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
    nlu: {
        type: "dialogflow",
        options: {
            client_access_token: process.env.DIALOGFLOW_CLIENT_ACCESS_TOKEN,
            developer_access_token: process.env.DIALOGFLOW_DEVELOPER_ACCESS_TOKEN,
            language: "ja"
        }
    },
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    line_access_token: process.env.LINE_ACCESS_TOKEN,
    facebook_app_secret: process.env.FACEBOOK_APP_SECRET,
    facebook_page_access_token: [
        {page_id: process.env.FACEBOOK_PAGE_ID, page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN}
    ],
    memory: {
        /* redis
        type: "redis",
        retention: 180,
        options: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        }*/
        /* mongodb
        type: "mongodb",
        retention: 180,
        options: {
            url: process.env.MONGODB_URL
        }
        */
        type: "memory-cache"
        retention: Number(process.env.MEMORY_RETENTION)
    },
    beacon_skill: {
        enter: "survey",
        leave: "bye"
    },
    follow_skill: "say-welcome",
    unfollow_skill: "clear-context",
    join_skill: "say-welcome",
    leave_skill: "clear-context",
    google_project_id: process.env.GOOGLE_PROJECT_ID,
    google_api_key: process.env.GOOGLE_API_KEY,
    auto_translation: process.env.AUTO_TRANSLATION
}));

module.exports = server;
