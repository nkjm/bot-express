'use strict';

module.exports = class Test_Utility {
    static create_options(oneoff_options = {}){
        let options = {
            memory_retention: oneoff_options.memory_retention || 60000, // This is optional but required for this testing since test does not go through index.js which sets default parameter.
            skill_path: "../../sample_skill/",
            enable_ask_retry: oneoff_options.enable_ask_retry || false,
            message_to_ask_retry: oneoff_options.message_to_ask_retry || "ごめんなさい、もうちょっと正確にお願いできますか？",
            line_channel_id: process.env.LINE_CHANNEL_ID,
            line_channel_secret: process.env.LINE_CHANNEL_SECRET,
            line_channel_access_token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
            facebook_app_secret: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
            facebook_page_access_token: [
                {page_id: process.env.FACEBOOK_PAGE_ID, page_access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN}
            ],
            default_intent: oneoff_options.default_intent || "input.unknown", // This is optional but required for this testing since test does not go through index.js which sets default parameter.
            default_skill: oneoff_options.default_skill || "builtin_default",
            beacon_skill: oneoff_options.beacon_skill || undefined,
            google_project_id: process.env.GOOGLE_PROJECT_ID,
            auto_translation: process.env.AUTO_TRANSLATION,
            nlp: "apiai",
            nlp_options: {
                client_access_token: process.env.APIAI_CLIENT_ACCESS_TOKEN,
                language: "ja"
            }
        }
        return options;
    }

    /*
    message_platform: line | facebook
    event_type: message | postback | beacon
    user_id: <string>
    payload: <object>
    */
    static create_req(message_platform, event_type, user_id, payload){
        return Test_Utility[message_platform + "_create_req"](event_type, user_id, payload);
    }

    static line_create_req(event_type, user_id, payload){
        let req = {
            body: {
                events: [{
                    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
                    "type": (event_type == "unsupported") ? "join" : event_type,
                    "timestamp": 1462629479859,
                    "source": {
                      "type": "user",
                      "userId": user_id
                    }
                }]
            },
            get: function(param){
                let header = {
                    "X-Line-Signature": "dummy_signature"
                };
                return header[param];
            }
        }

        if (["message", "postback", "beacon"].indexOf(event_type) != -1){
            req.body.events[0][event_type] = Test_Utility["line_create_" + event_type + "_event_payload"](payload);
        }

        return req;
    }

    static facebook_create_req(event_type, user_id, payload){
        let req = {
            body: {
                object: "page",
                entry: [{
                    messaging: [{
                        sender: {
                            id: user_id
                        },
                        recipient: {
                            id: "dummy_recipient_id"
                        }
                    }]
                }]
            },
            get: function(param){
                let header = {
                    "X-Hub-Signature": "dummy_signature"
                };
                return header[param];
            }
        }
        req.body.entry[0].messaging[0][event_type] = Test_Utility["facebook_create_" + event_type + "_event_payload"](payload);
        return req;
    }

    static unsupported_create_req(event_type, user_id, payload){
        let req = {
            body: {},
            get: function(param){
                let header = {};
                return header[param];
            }
        }
        return req;
    }

    static line_create_message_event_payload(payload){
        let event_payload;
        if (typeof payload == "string"){
            event_payload = {
                type: "text",
                text: payload
            }
        } else if (typeof payload == "object"){
            event_payload = payload;
        }
        return event_payload;
    }

    static facebook_create_message_event_payload(payload){
        let event_payload;
        if (typeof payload == "string"){
            event_payload = {
                text: payload
            };
        } else if (typeof payload == "object"){
            event_payload = payload;
        }
        return event_payload
    }

    static line_create_postback_event_payload(payload){
        return payload;
    }

    static facebook_create_postback_event_payload(payload){
        return payload;
    }

    static line_create_beacon_event_payload(payload){
        let event_payload;
        event_payload = payload || {
            "hwid": "d41d8cd98f",
            "type": "enter"
        };
        return event_payload;
    }

    static facebook_create_beacon_event_payload(payload){
        return {}
    }

    static line_create_unsupported_event_payload(payload){
        return null;
    }

    static facebook_create_unsupported_event_payload(payload){
        return null;
    }

    static create_req_to_clear_memory(user_id){
        let req = {
            clear_memory: user_id
        }
        return req;
    }
}
