"use strict";

/*
** Import Packages
*/
Promise = require("bluebird");
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");
const Nlu = require("../nlu");

module.exports = class PushFlow extends Flow {

    constructor(messenger, event, options) {
        let context = {
            _flow: "push",
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
            this.context.skill = super.instantiate_skill(this.event.intent.name);

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
                    debug(`Intent contains ${Object.keys(this.context.intent.parameters).length} parameter[s].`);
                    for (let param_key of Object.keys(this.context.intent.parameters)){
                        // Parse and Add parameters using skill specific logic.
                        debug(`Try to apply to ${param_key}...`);
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
                                        throw(error);
                                    }
                                }
                            )
                        );
                    }
                }

                await Promise.all(parameters_processed);
            }
        }

        // Finish.
        return await super.finish();
    } // End of run()
};
