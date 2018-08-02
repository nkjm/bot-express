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

    async run(){
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

        let skip_translate, skip_identify_intent, skip_instantiate_skill, skip_begin, skip_process_params;

        debug("### This is Start Conversation Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type(this.event, "start_conversation")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return this.context;
        }

        // Run event based handling.
        if (this.bot.identify_event_type() == "message" && this.bot.identify_message_type() != "text"){
            debug("This is a message event but not a text message so we use default skill.");

            skip_translate = true;
            skip_identify_intent = true;
            this.context.intent = {
                name: this.options.default_intent
            };
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
                        throw new Error("Recieved postback event and the payload indicates that this should contain intent but not found.");
                    }
                    debug("This is a postback event and we found intent inside payload.");
                    skip_translate = true;
                    skip_identify_intent = true;
                    this.context.sender_language = postback_payload.language;
                    this.context.intent = postback_payload.intent;
                } else {
                    debug("This is a postback event and payload is JSON. It's impossible to identify intent so we use default skill.");
                    skip_translate = true;
                    skip_identify_intent = true;
                    this.context.intent = {
                        name: this.options.default_intent
                    };
                }
            } catch(e) {
                debug(`Postback payload is not JSON format. We use as it is.`);
            }
        }

        // Language detection and translation
        if (!skip_translate){
            let message_text = this.bot.extract_message_text();

            // Detect sender language.
            if (this.translator && this.translator.enable_lang_detection){
                this.context.sender_language = await this.translator.detect(message_text);
                debug(`Bot language is ${this.options.language} and sender language is ${this.context.sender_language}`);
            } else {
                this.context.sender_language = undefined;
                debug(`We did not detect sender language.`);
            }

            // Language translation.
            if (this.translator && this.translator.enable_translation){
                debug(`Automatic translation has not been introduced.`);
            }
        }

        // Identify intent.
        if (!skip_identify_intent){
            let message_text = this.bot.extract_message_text();

            let nlu = new Nlu(this.options.nlu);
            debug(`Going to identify intent of ${message_text}...`);
            this.context.intent = await nlu.identify_intent(message_text, {
                session_id: this.bot.extract_session_id(),
                language: this.context.sender_language
            });
        }

        // Instantiate skill.
        if (!skip_instantiate_skill){
            this.context.skill = super.instantiate_skill(this.context.intent.name);

            // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
            // After that, we depend on context.to_confirm to identify to_confirm parameters.
            if (this.context.to_confirm.length == 0){
                this.context.to_confirm = super.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
            }
            debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);
        }

        // Run begin().
        if (!skip_begin){
            await super.begin();
        }

        // Process parameters.
        if (!skip_process_params){
            // If pause or exit flag found, we skip remaining process.
            if (this.context._pause || this.context._exit || this.context._init){
                debug(`Detected pause or exit or init flag so we skip processing parameters.`);
            } else {
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
                                        return super.react(error, param_key, this.context.intent.parameters[param_key]);
                                    } else {
                                        return Promise.reject(error);
                                    }
                                }
                            )
                        );
                    }
                }

                await Promise.all(parameters_processed);
            }
        }

        return await super.finish();
    } // End of run()
};
