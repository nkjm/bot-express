"use strict";

const debug = require("debug")("bot-express:message");

module.exports = class MessageSampleMessage {
    constructor(translator){
        this.t = translator;
    }

    /**
     * Create hello world message.
     * @method
     * @async
     * @return {Object} Message object.
     */
    async hello_world(){
        const message = {
            type: "text",
            text: await this.t.t("hello_world")
        }
        return message;
    }
}
