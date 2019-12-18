"use strict";

const debug = require("debug")("bot-express:flow");
const Flow = require("../flow");

module.exports = class StartConversationFlow extends Flow {

    constructor(options, slib, event, context) {
        super(options, slib, event, context);
    }

    /**
     * @method
     * @return {context}
     */
    async run(){
        debug("### This is Start Conversation Flow. ###");

        let skip_translate, skip_identify_intent, skip_instantiate_skill, skip_begin, skip_process_params;
        
        // Check if this event type is supported in this flow.
        if (!this.slib.messenger.check_supported_event_type(this.event, "start_conversation")){
            debug(`This is unsupported event type in this flow so skip processing.`);

            // Pass event through to another webhook if pass_through_webhook is set.
            if (this.options.pass_through_webhook){
                debug(`Passing event through another webhook..`)
                await this.bot.pass_through(this.options.pass_through_webhook, this.slib.messenger.get_secret(), this.event)
            }
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

            let postback_payload = this.slib.messenger.extract_postback_payload(this.event);
            if (super.is_intent_postback(this.event)){
                postback_payload = JSON.parse(postback_payload);
                skip_translate = true;
                skip_identify_intent = true;
                this.context.sender_language = postback_payload.language;
                this.context.intent = postback_payload.intent;
            } else {
                try {
                    postback_payload = JSON.parse(postback_payload);

                    debug("This is a postback event and payload is JSON. It's impossible to identify intent so we use default skill.");
                    skip_translate = true;
                    skip_identify_intent = true;
                    this.context.intent = {
                        name: this.options.default_intent
                    };
                } catch(e){
                    debug(`Postback payload is not JSON format. We use as it is.`);
                }
            }
        }

        // Language detection and translation
        let translated_message_text;
        if (!skip_translate){
            let message_text = this.bot.extract_message_text();

            // Detect sender language.
            if (this.bot.translator && this.bot.translator.enable_lang_detection){
                this.context.sender_language = await this.bot.translator.detect(message_text);
                debug(`Bot language is ${this.options.language} and sender language is ${this.context.sender_language}`);
            } else {
                this.context.sender_language = undefined;
                debug(`We did not detect sender language.`);
            }

            // Language translation.
            if (this.bot.translator && this.bot.translator.enable_translation && this.context.sender_language && this.options.language !== this.context.sender_language){
                translated_message_text = await this.bot.translator.translate(message_text, this.options.language);
            }
        }
        if (!translated_message_text){
            translated_message_text = this.bot.extract_message_text();
        }

        // Identify intent.
        if (!skip_identify_intent){
            debug(`Going to identify intent of ${translated_message_text}...`);
            this.context.intent = await this.slib.nlu.identify_intent(translated_message_text, {
                session_id: this.bot.extract_session_id(),
                channel_id: this.bot.extract_channel_id(),
                language: this.context.sender_language
            });
        }

        // If this is modify_previous_parameter, we make intent default_intent.
        if (this.options.modify_previous_parameter_intent && this.context.intent.name === this.options.modify_previous_parameter_intent){
            debug(`modify_previous_parameter in start_conversation flow is not supported so we set default intent.`);
            this.context.intent = {
                name: this.options.default_intent
            }
        }

        // Instantiate skill.
        if (!skip_instantiate_skill){
            this.context.skill = super.instantiate_skill(this.context.intent);

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
        await this.slib.logger.skill_status(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "launched", {
            context: this.context
        });

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message(),
            skill: this.context.skill.type
        });

        // Log chat.
        await this.slib.logger.chat(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "user", this.bot.extract_message());

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
                await super.process_parameters(this.context.intent.parameters);
            }
        }

        return super.respond();
    } // End of run()
};
