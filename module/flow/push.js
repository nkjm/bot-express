"use strict";

const debug = require("debug")("bot-express:flow");
const Flow = require("../flow");

module.exports = class PushFlow extends Flow {

    constructor(options, slib, event, context) {
        super(options, slib, event, context);
    }

    async run(){
        debug("### This is Push Flow. ###");

        if (!this.event.intent || !this.event.intent.name){
            throw new Error(`Push flow requires intent object set in event but not found.`);
        }
        
        // If clear_context is false, we instantiate skill by change_intent().
        if (this.event.clear_context === false){
            await super.change_intent(this.event.intent)
            return super.respond()
        }

        // Instantiate skill.
        this.context.intent = this.event.intent;
        this.context.sender_language = this.event.language;
        this.context.skill = super.instantiate_skill(this.event.intent);

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

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message(),
            skill: this.context.skill.type
        });

        // Log skill status.
        await this.slib.logger.skill_status(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "launched", {
            context: this.context
        });

        // Run begin().
        await super.begin();

        // Process parameters. If pause or exit flag found, we skip remaining process.
        if (this.context._pause || this.context._exit || this.context._init){
            debug(`Detected pause or exit or init flag so we skip processing parameters.`);
        } else {
            await super.process_parameters(this.context.intent.parameters);
        }

        // Finish.
        return super.respond();
    } // End of run()
};
