"use strict";

/*
** Import Packages
*/
const Promise = require('bluebird');
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");
const log = require("../logger");

module.exports = class ReplyFlow extends Flow {

    constructor(options, messenger, event, context) {
        super(options, messenger, event, context);
    }

    async run(){
        debug("### This is Reply Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type(this.event, "reply")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return this.context;
        }

        let param_value = this.messenger.extract_param_value(this.event);

        let is_postback = false;
        if (this.bot.type == "line"){
            if (this.event.type == "postback") is_postback = true;
        } else if (this.bot.type == "facebook"){
            if (this.event.postback) is_postback = true;
        }

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message()
        });

        // Log chat.
        log.chat(this.bot.extract_sender_id(), this.context.skill.type, "user", this.bot.extract_message());

        debug("Going to perform super.apply_parameter().");

        let applied_parameter = await super.apply_parameter(this.context.confirming, param_value);

        if (applied_parameter.error){
            // Language translation.
            let translated_param_value;
            if (typeof param_value == "string"){
                if (this.bot.translator && this.bot.translator.enable_translation && this.context.sender_language && this.options.language !== this.context.sender_language){
                    translated_param_value = await this.bot.translator.translate(param_value, this.options.language);
                }
            }
            if (!translated_param_value){
                translated_param_value = param_value;
            }

            let mind = await super.identify_mind(translated_param_value);

            if (mind.result == "modify_previous_parameter"){
                super.modify_previous_parameter();
            } else if (mind.result == "dig"){
                await super.dig(mind.intent);
            } else if (mind.result == "restart_conversation"){
                await super.restart_conversation(mind.intent);
            } else if (mind.result == "change_intent"){
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
