"use strict";

module.exports = class BotExpressParseError extends Error {
    constructor(e){
        if (typeof e == "string"){
            super(e);
        } else if (e instanceof Error){
            super(e.message);
        }
        this.name = "BotExpressParseError";
    }
}
