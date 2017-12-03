"use strict";

module.exports = class BotExpressWebhookSkip extends Error {
    constructor(message){
        super(message);
        this.name = "BotExpressWebhookSkip";
    }
}
