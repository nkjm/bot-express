"use strict";

const Promise = require('bluebird');
const debug = require("debug")("bot-express:flow");
const Flow = require("../flow");

module.exports = class ReplyFlow extends Flow {

    constructor(options, slib, event, context) {
        super(options, slib, event, context);
    }

    async run(){
        debug("### This is Reply Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.slib.messenger.check_supported_event_type(this.event, "reply")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return this.context;
        }

        // Check if this is intent postback.
        let skip_apply_parameter = false;
        let skip_translation = false;
        if (super.is_intent_postback(this.event)){
            skip_apply_parameter = true;
            skip_translation = true;
        }

        let param_value = this.slib.messenger.extract_param_value(this.event);

        // Add user's message to history.
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message(),
            skill: this.context.skill.type
        });

        // Log chat.
        await this.slib.logger.chat(this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "user", this.bot.extract_message());


        // Try to apply parameter.
        let applied_parameter;
        if (skip_apply_parameter){
            debug("Skipping apply_parameter().");
        } else {
            debug("Going to perform apply_parameter().");
            applied_parameter = await super.apply_parameter(this.context.confirming, param_value);
        }

        // If parser rejected the value, we try to identify other intention.
        if (skip_apply_parameter || applied_parameter.error){
            // Language translation.
            let translated_param_value;
            if (skip_translation){
                translated_param_value = param_value;
            } else {
                if (typeof param_value == "string"){
                    if (this.bot.translator && this.bot.translator.enable_translation && this.context.sender_language && this.options.language !== this.context.sender_language){
                        translated_param_value = await this.bot.translator.translate(param_value, this.options.language);
                    }
                }
                if (!translated_param_value){
                    translated_param_value = param_value;
                }
            }

            let mind = await super.identify_mind(translated_param_value);

            if (mind.result == "modify_previous_parameter"){
                super.modify_previous_parameter();
            } else if (mind.result == "dig"){
                await super.dig(mind.intent);
            } else if (mind.result == "restart_conversation"){
                // Log skill_status.
                await this.slib.logger.skill_status(this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "restarted", {
                    context: this.context, 
                    intent: mind.intent
                });

                await super.restart_conversation(mind.intent);
            } else if (mind.result == "change_intent"){
                // Log skill_status.
                await this.slib.logger.skill_status(this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "switched", {
                    context: this.context, 
                    intent: mind.intent
                });

                await super.change_intent(mind.intent);
            } else if (mind.result == "change_parameter"){
                // Now there is no chance to run this case since detecting change parameter in reply flow is very likely to be false positive.
                applied_parameter = await super.change_parameter(response.parameter.key, translated_param_value)
                await this.bot.react(applied_parameter.error, this.context.confirming, param_value);
            } else if (mind.result == "no_idea"){
                await this.bot.react(applied_parameter.error, this.context.confirming, param_value);
            } else {
                throw new Error(`Mind is unknown.`);
            }
        } else {
            if (applied_parameter == null){
                debug("Parameter was not applicable. We skip reaction and go to finish.");
            } else {
                await this.bot.react(applied_parameter.error, applied_parameter.param_key, applied_parameter.param_value);
            }
        }
        
        return super.finish();
    }
}
