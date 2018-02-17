"use strict";

/*
** Import Packages
*/
Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");
const Nlu = require("../nlu");

module.exports = class StartConversationFlow extends Flow {

    constructor(messenger, event, options) {
        let context = {
            _flow: "start_conversation",
            intent: null,
            confirmed: {},
            to_confirm: [],
            confirming: null,
            previous: {
                confirmed: [],
                message: []
            },
            _message_queue: [],
            sender_language: null,
            translation: null
        };
        super(messenger, event, context, options);
    }

    run(){
        /*
        ** ### Start Conversation Flow ###
        ** -> Run event based handling.
        ** -> Translate the message text.
        ** -> Identify intent.
        ** -> Instantiate skill.
        ** -> Run begin().
        ** -> Process parameters.
        ** -> Run finish().
        */

        let done_translate, done_identify_intent, done_instantiate_skill, done_begin, done_process_params, done_finish;
        let skip_translate, skip_identify_intent, skip_instantiate_skill, skip_begin, skip_process_params;

        debug("### This is Start Conversation Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type(this.event, "start_conversation")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return Promise.resolve(this.context);
        }

        // Run event based handling.
        if (this.bot.identify_event_type() == "message" && this.bot.identify_message_type() != "text"){
            debug("This is a message event but not a text message so we use default skill.");

            skip_translate = true;
            skip_identify_intent = true;
            done_identify_intent = Promise.resolve({
                name: this.options.default_intent
            });
        } else if (this.bot.identify_event_type() == "postback"){
            // There can be 3 cases.
            // - payload is JSON and contains intent.
            // - payload is JSON.
            // - payload is not JSON (just a string).
            let postback_payload = this.messenger.extract_postback_payload(this.event);
            try {
                postback_payload = JSON.parse(postback_payload);
                debug(`Postback payload is JSON format.`);

                if (postback_payload._type == "intent"){
                    if (!postback_payload.intent || !postback_payload.intent.name){
                        return Promise.reject(new Error("Recieved postback event and the payload indicates that this should contain intent but not found."));
                    }
                    debug("This is a postback event and we found intent inside payload.");
                    skip_translate = true;
                    skip_identify_intent = true;
                    this.context.sender_language = postback_payload.language;
                    done_identify_intent = Promise.resolve(postback_payload.intent);
                } else {
                    debug("This is a postback event and payload is JSON. It's impossible to identify intent so we use default skill.");
                    skip_translate = true;
                    skip_identify_intent = true;
                    done_identify_intent = Promise.resolve({
                        name: this.options.default_intent
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
                    this.context.sender_language = response[0].language;
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
                        });
                    }
                });
            }
        }

        // Identify intent.
        if (!skip_identify_intent){
            done_identify_intent = done_translate.then((message_text) => {
                let nlu = new Nlu(this.options.nlu);
                debug("NLU Abstraction instantiated.");
                debug(`Going to identify intent of ${message_text}...`);
                return nlu.identify_intent(message_text, {
                    session_id: this.bot.extract_session_id()
                });
            });
        }

        // Instantiate skill.
        if (!skip_instantiate_skill){
            done_instantiate_skill = done_identify_intent.then((intent) => {
                this.context.intent = intent;
                this.context.skill = super.instantiate_skill(intent.name);

                // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
                // After that, we depend on context.to_confirm to identify to_confirm parameters.
                if (this.context.to_confirm.length == 0){
                    this.context.to_confirm = super.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
                }
                debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);
                return this.context.skill;
            });
        }

        // Run begin().
        if (!skip_begin){
            done_begin = done_instantiate_skill.then((skill) => {
                return super.begin();
            });
        }

        // Process parameters.
        if (!skip_process_params){
            done_process_params = done_begin.then((response) => {
                // If we find some parameters from initial message, add them to the conversation.
                let parameters_processed = [];
                if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
                    for (let param_key of Object.keys(this.context.intent.parameters)){
                        // Parse and Add parameters using skill specific logic.
                        parameters_processed.push(
                            super.apply_parameter(param_key, this.context.intent.parameters[param_key]).then(
                                (applied_parameter) => {
                                    if (applied_parameter == null){
                                        debug("Parameter was not applicable. We skip reaction and go to finish.");
                                        return;
                                    }
                                    return super.react(null, applied_parameter.key, applied_parameter.value);
                                }
                            ).catch(
                                (error) => {
                                    if (error.name == "BotExpressParseError"){
                                        debug("Parser rejected the value.");
                                        return super.react(error, param_key, this.context.intent.parameters[param_key]);
                                    } else {
                                        return Promise.reject(error);
                                    }
                                }
                            )
                        );
                    }
                }

                return Promise.all(parameters_processed);
            });
        }

        // Finish.
        done_finish = done_process_params.then((response) => {
            return super.finish();
        });

        return done_finish;
    } // End of run()
};
