"use strict";

/*
** Import Packages
*/
Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");
const Nlu = require("../nlu");
const log = require("../logger");

module.exports = class StartConversationFlow extends Flow {

    constructor(messenger, event, options) {
        let context = {
            _flow: "start_conversation",
            intent: null,
            confirmed: {},
            to_confirm: [],
            confirming: null,
            event: event,
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

    /**
     * @method
     * @return {context}
     */
    async run(){
        let skip_translate, skip_identify_intent, skip_instantiate_skill, skip_begin, skip_process_params;

        debug("### This is Start Conversation Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type(this.event, "start_conversation")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return;
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
        let translated_message_text;
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
            if (this.translator && this.translator.enable_translation && this.context.sender_language && this.options.language !== this.context.sender_language){
                translated_message_text = await this.translator.translate(message_text, this.options.language);
            }
        }
        if (!translated_message_text){
            translated_message_text = this.bot.extract_message_text();
        }

        // Identify intent.
        if (!skip_identify_intent){
            let nlu = new Nlu(this.options.nlu);
            debug(`Going to identify intent of ${translated_message_text}...`);
            this.context.intent = await nlu.identify_intent(translated_message_text, {
                session_id: this.bot.extract_session_id(),
                language: this.context.sender_language
            });
        }

        // Instantiate skill.
        if (!skip_instantiate_skill){
            this.context.skill = super.instantiate_skill(this.context.intent.name);

            if (!this.context.skill){
                // Since skill not found, we end this conversation.
                return;
            }

            // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
            // After that, we depend on context.to_confirm to identify to_confirm parameters.
            if (this.context.to_confirm.length == 0){
                this.context.to_confirm = super.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
            }
            debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);
        }

        // Log skill status.
        log.skill_status(this.bot.extract_sender_id(), this.context.skill.type, "launched");

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message()
        });

        // Log chat.
        log.chat(this.bot.extract_sender_id(), this.context.skill.type, "user", this.bot.extract_message());

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
                if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
                    for (let param_key of Object.keys(this.context.intent.parameters)){
                        // Parse and Add parameters using skill specific logic.
                        let applied_parameter;
                        try {
                            applied_parameter = await super.apply_parameter(param_key, this.context.intent.parameters[param_key]);
                        } catch(e) {
                            await super.react(e, param_key, this.context.intent.parameters[param_key]);
                            continue;
                        }

                        if (applied_parameter == null){
                            debug("Parameter was not applicable. We skip reaction.");
                            continue;
                        }

                        await super.react(null, applied_parameter.key, applied_parameter.value);
                    }
                }
            }
        }

        return super.finish();
    } // End of run()
};
