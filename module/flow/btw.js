"use strict";

Promise = require('bluebird');
const debug = require("debug")("bot-express:flow");
const Flow = require("../flow");

module.exports = class BtwFlow extends Flow {

    constructor(options, logger, messenger, event, context) {
        super(options, logger, messenger, event, context);
    }

    async run(){
        debug("### This is BTW Flow. ###");

        let skip_translate, skip_identify_mind, skip_run_mind_based_flow;
        let mind;

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type(this.event, "btw")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return this.context;
        }

        // Run event based handling.
        if (this.bot.identify_event_type() == "message" && this.bot.identify_message_type() != "text"){
            debug("This is a message event but not a text message so we skip translation.");

            skip_translate = true;
            skip_identify_mind = true;
            mind = {
                result: "no_idea"
            };
        } else if (this.bot.identify_event_type(this.event) == "postback"){
            let postback_payload;
            try {
                postback_payload = JSON.parse(this.messenger.extract_postback_payload(this.event));
                debug(`Postback payload is JSON format.`);
            } catch(e) {
                postback_payload = this.messenger.extract_postback_payload(this.event);
                debug(`Postback payload is not JSON format. We use as it is.`);
            }

            if (typeof postback_payload == "object"){
                if (postback_payload._type == "intent"){
                    if (!postback_payload.intent || !postback_payload.intent.name){
                        throw new Error("Recieved postback event and the payload indicates that this should contain intent but not found.");
                    }

                    this.context.sender_language = postback_payload.language;

                    if (postback_payload.intent && postback_payload.intent.name == this.context.intent.name){
                        debug(`We conluded that user has in mind to restart conversation.`);
                        skip_translate = true;
                        skip_identify_mind = true;
                        mind = {
                            result: "restart_conversation",
                            intent: postback_payload.intent
                        };
                    } else if (postback_payload.intent && postback_payload.intent.name != this.context.intent.name){
                        debug(`We conluded that user has in mind to change intent.`);
                        skip_translate = true;
                        skip_identify_mind = true;
                        mind = {
                            result: "change_intent",
                            intent: postback_payload.intent
                        };
                    }
                } else {
                    debug("This is a postback event and payload is JSON. It's impossible to identify intent so we use default skill.");
                    skip_translate = true;
                    skip_identify_mind = true;
                    mind = {
                        result: "no_idea"
                    };
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

        // Identify mind.
        if (!skip_identify_mind){
            mind = await super.identify_mind(translated_message_text);
        }

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message()
        });

        // Log chat.
        await this.logger.chat(this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "user", this.bot.extract_message());

        // Run mind based flow.
        if (!skip_run_mind_based_flow){
            if (mind.result == "modify_previous_parameter"){
                super.modify_previous_parameter();
            } else if (mind.result == "restart_conversation"){
                await super.restart_conversation(mind.intent);
            } else if (mind.result == "change_intent"){
                await super.change_intent(mind.intent);
            } else if (mind.result == "change_parameter"){
                const applied_parameter = await super.change_parameter(mind.parameter.key, mind.payload);
                await this.bot.react(null, applied_parameter.param_key, applied_parameter.param_value);
            } else if (mind.result == "no_idea"){
                await super.change_intent(mind.intent);
            }
        }

        // Finish.
        return super.finish();
    }
}
