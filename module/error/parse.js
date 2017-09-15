"use strict";

module.exports = class BotExpressParseError extends Error {
    constructor(message){
        super(message);
        this.name = "BotExpressParseError";
    }
}
