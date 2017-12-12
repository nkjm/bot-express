"use strict";

module.exports = class TestUtilityLine {

    /**
    Method to create req object.
    @param {String} event_type - message, postback, beacon, follow, unfollow, join, leave
    @param {String} mem_id - key of context memory
    @param {String|Object} payload - payload of event object
    @param {String} [source_type="user"] - user, group, room
    @param {String} [user_id="dummy_user_id"] - sender user id
    @return {Object} - request object
    */
    static create_req(event_type, mem_id, payload, source_type = "user", user_id = "dummy_user_id"){
        let event = TestUtilityLine[`_create_${event_type}_event`](mem_id, payload, source_type, user_id);

        let req = {
            body: {
                events: [event]
            },
            get: function(param){
                let header = {
                    "X-Line-Signature": "dummy_signature"
                };
                return header[param];
            }
        }

        return req;
    }

    static _create_event_template(event_type, mem_id, source_type, user_id){
        let event = {
            replyToken: "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
            type: event_type,
            timestamp: 1462629479859,
            source: {
                type: source_type
            }
        }

        if (source_type == "user"){
            event.source.userId = mem_id;
        } else if (source_type == "group"){
            event.source.roomId = mem_id;
            event.source.userId = user_id;
        } else if (source_type == "room"){
            event.source.groupId = mem_id;
            event.source.userId = user_id;
        }
        return event;
    }

    static _create_unsupported_event(mem_id, payload, source_type, user_id){
        let event = TestUtilityLine._create_event_template("unsupported", mem_id, source_type, user_id);
        event.unsupported = {
            dummy: "dummy"
        }
        return event;
    }

    static _create_message_event(mem_id, payload, source_type, user_id){
        let event = TestUtilityLine._create_event_template("message", mem_id, source_type, user_id);

        if (typeof payload == "string"){
            event.message = {
                type: "text",
                text: payload
            }
        } else if (typeof payload == "object"){
            event.message = payload;
        }

        return event;
    }

    static _create_postback_event(mem_id, payload, source_type, user_id){
        let event = TestUtilityLine._create_event_template("postback", mem_id, source_type, user_id);

        if (typeof payload == "string"){
            event.postback = {
                data: payload
            }
        } else if (typeof payload == "object"){
            event.postback = payload;
        }

        return event;
    }

    static _create_beacon_event(mem_id, payload = {hwid: "d41d8cd98f", type: "enter"}, source_type, user_id){
        let event = TestUtilityLine._create_event_template("beacon", mem_id, source_type, user_id);

        event.beacon = payload;

        return event;
    }

    static _create_follow_event(mem_id, payload, source_type, user_id){
        let event = TestUtilityLine._create_event_template("follow", mem_id, source_type, user_id);

        return event;
    }

    static _create_unfollow_event(mem_id, payload, source_type, user_id){
        let event = TestUtilityLine._create_event_template("unfollow", mem_id, source_type, user_id);
        delete event.replyToken;

        return event;
    }

    static _create_join_event(mem_id, payload, source_type, user_id){
        let event = TestUtilityLine._create_event_template("join", mem_id, source_type, user_id);
        delete event.source.userId;

        return event;
    }

    static _create_leave_event(mem_id, payload, source_type, user_id){
        let event = TestUtilityLine._create_event_template("leave", mem_id, source_type, user_id);
        delete event.source.userId;
        delete event.replyToken;

        return event;
    }

    /**
    Method to create req object.
    @param {String} event - Event object.
    @return {Object} - Request object
    */
    static create_req_with_event(event){
        let req = {
            body: {
                events: [event]
            },
            get: function(param){
                let header = {
                    "X-Line-Signature": "dummy_signature"
                };
                return header[param];
            }
        }
        return req;
    }

}
