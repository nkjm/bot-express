"use strict";

/*
** Import Packages
*/
Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");
const Nlu = require("../nlu");
const log = require("../logger");

module.exports = class PushFlow extends Flow {

    constructor(options, messenger, event, context) {
        super(options, messenger, event, context);
    }

    async run(){
        /*
        ** ### Push Flow ###
        ** -> Instantiate skill.
        ** -> Run begin().
        ** -> Process parameters.
        ** -> Run finish().
        */

        let skip_instantiate_skill, skip_begin, skip_process_params;

        debug("### This is Push Flow. ###");

        if (!this.event.intent || !this.event.intent.name){
            throw new Error(`Push flow requires intent object set in event but not found.`);
        }

        // Instantiate skill.
        if (!skip_instantiate_skill){
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
        }

        // Add user's message to history
        this.context.previous.message.unshift({
            from: "user",
            message: this.bot.extract_message()
        });

        // Log skill status.
        log.skill_status(this.bot.extract_sender_id(), this.context.skill.type, "launched");

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

        // Finish.
        return super.finish();
    } // End of run()
};
