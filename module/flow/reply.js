"use strict";

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

        // Dispatch action based on reply type.
        if (super.is_intent_postback(this.event)){
            // This is intent postback.
            const intent = JSON.parse(this.slib.messenger.extract_postback_payload(this.event)).intent;
            if (this.options.modify_previous_parameter_intent === intent.name){
                super.modify_previous_parameter();
            } else if (this.context.intent.name === intent.name){
                await super.restart_conversation(intent);
            } else {
                await super.change_intent(intent);
            }
        } else if (super.is_process_parameters_postback(this.event)){
            // This is process parameters postback.
            const parameters = JSON.parse(this.slib.messenger.extract_postback_payload(this.event)).parameters;
            await super.process_parameters(parameters);
        } else {
            // This is generic reply.

            const param_value = this.slib.messenger.extract_param_value(this.event);

            // Parse value.
            const applied_parameter = await super.apply_parameter(this.context.confirming, param_value);

            if (applied_parameter === null){
                // Parameter is not applicable.
                debug("Parameter was not applicable. We skip reaction and go to finish.");
            } else if (!applied_parameter.error){
                // Parameter accepted.
                await this.bot.react(applied_parameter.error, applied_parameter.param_name, applied_parameter.param_value);

                // Apply while condition.
                const param = this.bot.get_parameter(applied_parameter.param_name)
                if (param.list && param.while && typeof param.while === "function"){
                    if (await param.while(this.bot, this.event, this.context)){
                        // Collect this parameter again.
                        this.bot.collect(applied_parameter.param_name)
                    }
                }
            } else {
                // Parameter rejected.
                
                // Translate value if it's string and translator is available.
                let translated_param_value = JSON.parse(JSON.stringify(param_value));
                if (typeof param_value == "string"){
                    if (this.bot.translator && this.bot.translator.enable_translation && this.context.sender_language && this.options.language !== this.context.sender_language){
                        translated_param_value = await this.bot.translator.translate(param_value, this.options.language);
                    }
                }

                let mind = await super.identify_mind(translated_param_value);

                if (mind.result == "modify_previous_parameter"){
                    super.modify_previous_parameter();
                } else if (mind.result == "dig"){
                    await super.dig(mind.intent);
                } else if (mind.result == "restart_conversation"){
                    // Log skill_status.
                    await this.slib.logger.skill_status(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "restarted", {
                        context: this.context, 
                        intent: mind.intent
                    });

                    await super.restart_conversation(mind.intent);
                } else if (mind.result == "change_intent"){
                    // Log skill_status.
                    await this.slib.logger.skill_status(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "switched", {
                        context: this.context, 
                        intent: mind.intent
                    });

                    await super.change_intent(mind.intent);
                } else if (mind.result == "change_parameter"){
                    // Now there is no chance to run this case since detecting change parameter in reply flow is very likely to be false positive.
                    applied_parameter = await super.change_parameter(mind.parameter.name, translated_param_value)
                    await this.bot.react(applied_parameter.error, this.context.confirming, param_value);
                } else if (mind.result == "no_idea"){
                    await this.bot.react(applied_parameter.error, this.context.confirming, param_value);
                } else {
                    throw new Error(`Mind is unknown.`);
                }
            }
        }

        // Add user's message to history.
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message(),
            skill: this.context.skill.type
        });

        // Log chat.
        await this.slib.logger.chat(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "user", this.bot.extract_message());
        
        return super.respond();
    }
}
