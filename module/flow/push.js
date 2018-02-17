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

    run(){
        /*
        ** ### Push Flow ###
        ** -> Instantiate skill.
        ** -> Run begin().
        ** -> Process parameters.
        ** -> Run finish().
        */

        let done_instantiate_skill, done_begin, done_process_params, done_finish;
        let skip_instantiate_skill, skip_begin, skip_process_params;

        debug("### This is Push Flow. ###");

        if (!this.event.intent || !this.event.intent.name){
            return Promise.reject(new Error(`Push flow requires intent object set in event but not found.`));
        }

        // Instantiate skill.
        if (!skip_instantiate_skill){
            done_instantiate_skill = Promise.resolve(this.event).then((event) => {
                this.context.intent = event.intent;
                this.context.sender_language = event.language;
                this.context.skill = super.instantiate_skill(event.intent.name);

                // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
                // After that, we depend on context.to_confirm to identify to_confirm parameters.
                if (this.context.to_confirm.length == 0){
                    this.context.to_confirm = super.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
                }
                debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);

                return this.context.skill;
            });
        }

        // Run begin().
        if (!skip_begin){
            done_begin = done_instantiate_skill.then((skill) => {
                return super.begin();
            });
        }

        // Process parameters.
        if (!skip_process_params){
            done_process_params = done_begin.then((response) => {
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
                                        debug("Parser rejected the value.");
                                        return super.react(error, param_key, this.context.intent.parameters[param_key]);
                                    } else {
                                        return Promise.reject(error);
                                    }
                                }
                            )
                        );
                    }
                }

                return Promise.all(parameters_processed);
            });
        }

        // Finish.
        done_finish = done_process_params.then((response) => {
            return super.finish();
        });

        return done_finish;
    } // End of run()
};
