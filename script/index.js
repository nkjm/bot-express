"use strict";

/*
** Import Packages
*/
const server = require("express")();
const bot_express = require("bot-express");

/*
** Middleware Configuration
*/
server.listen(process.env.PORT || 5000, () => {
    console.log("server is running...");
});

/*
** Mount bot-express
*/
server.use("/webhook", bot_express({
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
    memory: {
        type: "memory-cache",
        retention: 600
    },
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    line_access_token: process.env.LINE_ACCESS_TOKEN,
    facebook_app_secret: process.env.FACEBOOK_APP_SECRET,
    facebook_page_access_token: [
        {page_id: process.env.FACEBOOK_PAGE_ID, page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN}
    ],
    default_skill: process.env.DEFAULT_SKILL,
    google_project_id: process.env.GOOGLE_PROJECT_ID,
    google_api_key: process.env.GOOGLE_API_KEY,
    auto_translation: process.env.AUTO_TRANSLATION
}));

module.exports = server;
