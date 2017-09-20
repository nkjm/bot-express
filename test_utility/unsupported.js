"use strict";

module.exports = class TestUtilityUnsupported {
    /**
    Method to create req object.
    @param {String} event_type - dummy
    @param {String} mem_id - dummy
    @param {String|Object} payload - dummy
    @param {String} source_type - dummy
    @param {String} user_id - dummy
    @return {Object} - dummy
    */
    static create_req(event_type, mem_id, payload, source_type, user_id){
        let req = {
            body: {},
            get: function(param){
                let header = {};
                return header[param];
            }
        }
        return req;
    }
}
