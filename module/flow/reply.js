"use strict";

/*
** Import Packages
*/
Promise = require('bluebird');
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");

module.exports = class ReplyFlow extends Flow {

    constructor(messenger, event, context, options) {
        context._flow = "reply";
        super(messenger, event, context, options);
    }

    run(){
        debug("### This is Reply Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type(this.event, "reply")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return Promise.resolve(this.context);
        }

        let param_value = this.messenger.extract_param_value(this.event);

        let is_postback = false;
        if (this.bot.type == "line"){
            if (this.event.type == "postback") is_postback = true;
        } else if (this.bot.type == "facebook"){
            if (this.event.postback) is_postback = true;
        }

        let translated;
        if (!this.messenger.translater || is_postback || typeof param_value != "string"){
            translated = Promise.resolve(param_value);
        } else {
            // If sender language is different from bot language, we translate message into bot language.
            debug(`Bot language is ${this.options.language} and sender language is ${this.context.sender_language}`);
            if (this.options.language === this.context.sender_language){
                debug("Won't translate param value.");
                translated = Promise.resolve(param_value);
            } else {
                debug("Translating param value...");
                translated = this.messenger.translater.translate(param_value, this.options.language).then((response) => {
                    debug("Translater response follows.");
                    debug(response);
                    this.context.translation = response[0];
                    return response[0];
                });
            }
        }

        let translated_param_value;
        return translated.then(
            (response) => {
                translated_param_value = response;
                debug("Going to perform super.apply_parameter().");
                return super.apply_parameter(this.context.confirming, translated_param_value);
            }
        ).then(
            (applied_parameter) => {
                if (applied_parameter == null){
                    debug("Parameter was not applicable. We skip reaction and go to finish.");
                    return;
                }
                debug("Parser accepted the value.");
                debug("Going to perform reaction.");
                return super.react(null, applied_parameter.key, applied_parameter.value);
            }
        ).catch(
            (error) => {
                if (error.name == "BotExpressParseError"){
                    debug("Parser rejected the value. We are going to identify what user has in mind by this message.");

                    return super.identify_mind(translated_param_value).then(
                        (response) => {
                            if (response.result == "dig"){
                                return super.dig(response.intent);
                            } else if (response.result == "restart_conversation"){
                                return super.restart_conversation(response.intent);
                            } else if (response.result == "change_intent"){
                                return super.change_intent(response.intent);
                            } else if (response.result == "change_parameter"){
                                debug(`While we concluded this is change_parameter, it still can be false positive unless developer configured accruate parser to every single parameters. So we do not perform change_parameter() at this momenet. We just take reaction.`);
                                return super.react(error, this.context.confirming, translated_param_value);
                                /*
                                // Will be activated later.
                                return super.change_parameter(response.parameter.key, translated_param_value).then(
                                    (applied_parameter) => {
                                        return super.react(null, applied_parameter.key, applied_parameter.value);
                                    }
                                );
                                */
                            } else if (response.result == "no_idea"){
                                return super.react(error, this.context.confirming, translated_param_value);
                            }
                        }
                    );
                } else {
                    return Promise.reject(error);
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
