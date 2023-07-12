"use strict";

/**
@deprecated
@class
 */
class BotExpressParseError extends Error {
    constructor(message){
        super(message);
        this.name = "BotExpressParseError";
    }
}

module.exports = BotExpressParseError;
