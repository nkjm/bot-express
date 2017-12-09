"use strict";

require("dotenv").config();

const messengers = {
    line: require("./line"),
    facebook: require("./facebook"),
    unsupported: require("./unsupported")
}

module.exports = class TestUtility {

    static create_options(oneoff_options = {}){
        let options = {
            skill_path: "../../sample_skill/",
            nlu: {
                type: "dialogflow",
                options: {
                    client_access_token: process.env.DIALOGFLOW_CLIENT_ACCESS_TOKEN,
                    developer_access_token: process.env.DIALOGFLOW_DEVELOPER_ACCESS_TOKEN,
                    language: "ja"
                }
            },
            memory: {
                type: "memory-cache",
                retention: 60
            },
            line_channel_secret: process.env.LINE_CHANNEL_SECRET,
            line_access_token: process.env.LINE_ACCESS_TOKEN,
            facebook_app_secret: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
            facebook_page_access_token: [
                {page_id: process.env.FACEBOOK_PAGE_ID, page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN}
            ],
            default_intent: oneoff_options.default_intent || "input.unknown", // This is optional but required for this testing since test does not go through index.js which sets default parameter.
            default_skill: oneoff_options.default_skill || "builtin_default",
            beacon_skill: oneoff_options.beacon_skill || undefined,
            google_project_id: process.env.GOOGLE_PROJECT_ID,
            auto_translation: process.env.AUTO_TRANSLATION
        }
        return options;
    }

    /**
    Method to create request object.
    @param {String} messenger_type - line, facebook, unsupported
    @param {String} event_type - message, postback, beacon, follow, unfollow, join, leave
    @param {String} mem_id - key for context memory.
    @param {String|Object} payload - payload of the event object.
    @param {String} [source_type] - user, group, room
    @param {String} [user_id] - user id. *only used when messenger_type is line and source_type is group or room.
    */
    static create_req(messenger_type, event_type, mem_id, payload, source_type, user_id){
        return messengers[messenger_type].create_req(event_type, mem_id, payload, source_type, user_id);
    }

    static create_req_to_clear_memory(mem_id){
        let req = {
            clear_memory: mem_id
        }
        return req;
    }
}
