"use strict";

/*
** Import Packages
*/
Promise = require('bluebird');
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");

module.exports = class BtwFlow extends Flow {

    constructor(messenger, event, context, options) {
        context._flow = "btw";
        super(messenger, event, context, options);
    }

    run(){
        /*
        ** ### Start Conversation Flow ###
        ** -> Run event based handling.
        ** -> Translate the message text.
        ** -> Identify mind.
        ** -> Run mind based flow.
        ** -> Run finish().
        */

        let done_translate, done_identify_mind, done_run_mind_based_flow, done_finish;
        let skip_translate, skip_identify_mind, skip_run_mind_based_flow;

        debug("### This is BTW Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type(this.event, "btw")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return Promise.resolve(this.context);
        }

        // Run event based handling.
        if (this.bot.identify_event_type() == "message" && this.bot.identify_message_type() != "text"){
            debug("This is a message event but not a text message so we skip translation.");

            skip_translate = true;
            skip_identify_mind = true;
            done_identify_mind = Promise.resolve({
                result: "no_idea"
            });
        } else if (this.bot.identify_event_type(this.event) == "postback"){
            let postback_payload = this.messenger.extract_postback_payload(this.event);

            try {
                postback_payload = JSON.parse(postback_payload);
                debug(`Postback payload is JSON format.`);

                if (postback_payload._type == "intent"){
                    if (!postback_payload.intent || !postback_payload.intent.name){
                        return Promise.reject(new Error("Recieved postback event and the payload indicates that this should contain intent but not found."));
                    }

                    this.context.sender_language = postback_payload.language;

                    if (postback_payload.intent && postback_payload.intent.name == this.context.intent.name){
                        debug(`We conluded that user has in mind to restart conversation.`);
                        skip_translate = true;
                        skip_identify_mind = true;
                        done_identify_mind = Promise.resolve({
                            result: "restart_conversation",
                            intent: postback_payload.intent
                        });
                    } else if (postback_payload.intent && postback_payload.intent.name != this.context.intent.name){
                        debug(`We conluded that user has in mind to change intent.`);
                        skip_translate = true;
                        skip_identify_mind = true;
                        done_identify_mind = Promise.resolve({
                            result: "change_intent",
                            intent: postback_payload.intent
                        });
                    }
                } else {
                    debug("This is a postback event and payload is JSON. It's impossible to identify intent so we use default skill.");
                    skip_translate = true;
                    skip_identify_mind = true;
                    done_identify_mind = Promise.resolve({
                        result: "no_idea"
                    });
                }
            } catch(e) {
                debug(`Postback payload is not JSON format. We use as it is.`);
            }
        }

        // Translate.
        if (!skip_translate){
            let message_text = this.bot.extract_message_text();

            if (!this.messenger.translater){
                done_translate = Promise.resolve(message_text);
            } else {
                done_translate = Promise.resolve().then((response) => {
                    return this.messenger.translater.detect(message_text)
                }).then((response) => {
                    debug(`Bot language is ${this.options.language} and sender language is ${this.context.sender_language}`);

                    // If sender language is different from bot language, we translate message into bot language.
                    if (this.options.language === this.context.sender_language){
                        debug("Won't translate message text.");
                        return message_text;
                    } else {
                        debug("Translating message text...");
                        return this.messenger.translater.translate(message_text, this.options.language).then((response) => {
                            debug("Translater response follows.");
                            debug(response);
                            this.context.translation = response[0];
                            return response[0];
                        })
                    }
                });
            }
        }

        // Identify mind.
        if (!skip_identify_mind){
            done_identify_mind = done_translate.then((message_text) => {
                debug(`Going to identify mind of ${message_text}...`);
                return super.identify_mind(message_text);
            });
        }

        // Run mind based flow.
        if (!skip_run_mind_based_flow){
            done_run_mind_based_flow = done_identify_mind.then((mind) => {
                if (mind.result == "restart_conversation"){
                    return super.restart_conversation(mind.intent);
                } else if (mind.result == "change_intent"){
                    return super.change_intent(mind.intent);
                } else if (mind.result == "change_parameter"){
                    return super.change_parameter(mind.parameter.key, mind.payload).then((applied_parameter) => {
                        return super.react(null, applied_parameter.key, applied_parameter.value);
                    });
                } else if (mind.result == "no_idea"){
                    return super.change_intent(mind.intent);
                }
            })
        }

        // Finish.
        done_finish = done_run_mind_based_flow.then((response) => {
            return super.finish();
        });

        return done_finish;
    }
}
