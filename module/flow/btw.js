'use strict';

/*
** Import Packages
*/
let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let Flow = require("./flow");

module.exports = class BtwFlow extends Flow {

    constructor(messenger, event, context, options) {
        context._flow = "btw";
        super(messenger, event, context, options);
    }

    run(){
        debug("### This is BTW Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type("btw")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return Promise.resolve(this.context);
        }

        let param_value = this.messenger.extract_param_value();

        let is_postback = false;
        if (this.messenger.type == "line"){
            if (this.event.type == "postback") is_postback = true;
        } else if (this.messenger.type == "facebook"){
            if (this.event.postback) is_postback = true;
        }

        let translated;
        if (!this.messenger.translater || is_postback || typeof param_value != "string"){
            translated = Promise.resolve(param_value);
        } else {
            // If sender language is different from bot language, we translate message into bot language.
            debug(`Bot language is ${this.options.language} and sender language is ${this.context.sender_language}`);
            if (this.options.language === this.context.sender_language){
                debug("We do not translate param value.");
                translated = Promise.resolve(param_value);
            } else {
                debug("Translating param value...");
                translated = this.messenger.translater.translate(param_value, this.options.language).then(
                    (response) => {
                        debug("Translater response follows.");
                        debug(response);
                        return response[0];
                    }
                );
            }
        }

        let translated_param_value;
        return translated.then(
            (response) => {
                translated_param_value = response;
                return super.what_you_want(translated_param_value);
            }
        ).then(
            (response) => {
                if (response.result == "restart_conversation"){
                    return super.restart_conversation(response.intent);
                } else if (response.result == "change_intent"){
                    return super.change_intent(response.intent);
                } else if (response.result == "change_parameter"){
                    return super.change_parameter(response.parameter.key, translated_param_value).then(
                        (applied_parameter) => {
                            return super.react(null, applied_parameter.key, applied_parameter.value);
                        }
                    );
                } else if (response.result == "no_idea"){
                    return super.change_intent(response.intent);
                }
            }
        ).then(
            (response) => {
                // Run final action.
                debug("Going to perform super.finish().");
                return super.finish();
            }
        );
    }
}
