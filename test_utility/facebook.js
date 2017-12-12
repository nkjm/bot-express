"use strict";

module.exports = class TestUtilityFacebook {

    /**
    Method to create req object.
    @param {String} event_type - message, postback
    @param {String} mem_id - key of context memory
    @param {String|Object} payload - payload of event object
    @param {String} user_id - leave this blank
    @param {String} source_type - leave this blank
    @return {Object} - request object
    */
    static create_req(event_type, mem_id, payload, source_type = "dummy", user_id = "dummy"){
        let event = TestUtilityFacebook[`_create_${event_type}_event`](mem_id, payload);
        let req = {
            body: {
                object: "page",
                entry: [event]
            },
            get: function(param){
                let header = {
                    "X-Hub-Signature": "dummy_signature"
                };
                return header[param];
            }
        }
        return req;
    }

    static _create_event_template(mem_id){
        let event = {
            id: "dummy_page_id",
            time: 1458692752478, // dummy time
            messaging: [{
                sender: {
                    id: mem_id
                },
                recipient: {
                    id: "dummy_page_id"
                },
                timestamp: 1458692752478
            }]
        }
        return event;
    }

    static _create_message_event(mem_id, payload){
        let event = TestUtilityFacebook._create_event_template(mem_id);

        if (typeof payload == "string"){
            event.messaging[0].message = {
                text: payload
            }
        } else if (typeof payload == "object"){
            event.messaging[0].message = payload;
        }

        return event;
    }

    static _create_postback_event(mem_id, payload){
        let event = TestUtilityFacebook._create_event_template(mem_id);

        if (typeof payload == "string"){
            event.messaging[0].postback = {
                payload: payload
            }
        } else if (typeof payload == "object"){
            event.messaging[0].postback = payload;
        }

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
                object: "page",
                entry: [event]
            },
            get: function(param){
                let header = {
                    "X-Hub-Signature": "dummy_signature"
                };
                return header[param];
            }
        }
        return req;
    }
}
