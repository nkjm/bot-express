"use strict";

const debug = require("debug")("bot-express:bot");

/**
* Toolkit to be used by skill.
* @class
*/
class Bot {
    constructor(options, event, context, messenger){
        /**
        @prop {String} type - Type of messenger. The value can be "line","facebook" and "google".
        @prop {Object} plugin - Object which has direct access to each messenger libraries.
        */
        this.type = messenger.type;
        this.plugin = messenger.plugin;
        this._options = options;
        this._event = event;
        this._context = context;
        this._messenger = messenger;
    }

    /**
    * Reply messages to sender to collect parameter
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Array.<Promise>}
    */
    reply_to_collect(messages){
        return this.reply(messages, true)
    }

    /**
    * Reply message to sender. This function can be called just once in a flow. To send multiple messages, give multiple messages to this function or use queue(MESSAGES) function instead.
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to reply.
    * @returns {Promise.<Object>} - Returns promise returning response from Messenger API.
    */
    reply(messages, to_collect = false){
        if (messages){
            this.queue(messages);
        }

        let done_compile_messages = [];
        for (let message of this._context._message_queue){
            done_compile_messages.push(
                // Compiling message.
                this._messenger.compile_message(message).then((compiled_message) => {
                    if (!this._messenger.translater){
                        // Auto translation is disabled so we won't translate.
                        debug("Translater is disabled so we won't translate.");
                        return compiled_message;
                    }

                    if (!this._context.sender_language || this._context.sender_language === this._options.language){
                        // Auto tranlsation is enabled but sender's language is identical to bot's language so we don't have to tranaslate.
                        debug("Reciever's language is undefined or same as bot's language so we won't translate.");
                        return compiled_message;
                    }

                    debug(`Translating following message...`);
                    debug(compiled_message);

                    let message_type = this._messenger.Messenger_classes[this.type].identify_message_type(compiled_message);
                    return this._messenger.Messenger_classes[this.type].translate_message(this._messenger.translater, message_type, compiled_message, this._context.sender_language);
                })
            );
        }

        let compiled_messages;
        return Promise.all(done_compile_messages).then((response) => {
            compiled_messages = response;
            if (this._event.type == "bot-express:push"){
                return this._messenger.send(this._event, this._event.to[`${this._event.to.type}Id`], compiled_messages);
            }
            if (to_collect || this._context.parent){
                return this._messenger.reply_to_collect(this._event, compiled_messages);
            }
            return this._messenger.reply(this._event, compiled_messages);
        }).then((response) => {
            for (let compiled_message of compiled_messages){
                this._context.previous.message.unshift({
                    from: "bot",
                    message: compiled_message
                });
            }
            this._context._message_queue = [];
            return response;
        });
    }

    /**
    * Send(Push) message to specified user.
    * @param {String} recipient_id - Recipient user id.
    * @param {MessageObject|Array.<MessageObject>} messages - Messages object[s] to send.
    * @param {String} language - ISO-639-1 based language code to translate to.
    * @returns {Promise.<Object>} - Returns promise returning response from Messenger API.
    */
    send(recipient_id, messages, language){
        // If messages is not array, we make it array.
        if (messages.length === undefined){
            messages = [messages];
        }

        let done_compile_messages = [];
        for (let message of messages){
            done_compile_messages.push(
                this.compile_message(message).then((compiled_message) => {
                    if (!this._messenger.translater){
                        // Auto translation is disabled so we won't translate.
                        debug("Translater is disabled so we won't translate.");
                        return compiled_message;
                    }

                    if (!language || language === this._options.language){
                        // Auto tranlsation is enabled but reciever's language is identical to bot's language so we don't have to tranaslate.
                        debug("Reciever's language is undefined or same as bot's language so we won't translate.");
                        return compiled_message;
                    }

                    debug(`Translating following message...`);
                    debug(compiled_message);

                    let message_type = this._messenger.Messenger_classes[this.type].identify_message_type(compiled_message);
                    return this._messenger.Messenger_classes[this.type].translate_message(this._messenger.translater, message_type, compiled_message, language);
                })
            );
        }
        let compiled_messages;
        return Promise.all(done_compile_messages).then((response) => {
            compiled_messages = response;
            return this._messenger.send(this._event, recipient_id, compiled_messages);
        }).then((response) => {
            for (let compiled_message of compiled_messages){
                this._context.previous.message.unshift({
                    from: "bot",
                    message: compiled_message
                });
            }
            return response;
        });
    }

    /**
    * Send(Push) messages to multiple users.
    * @param {Array.<String>} recipient_ids - Array of recipent user id.
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to send.
    * @param {String} language - ISO-639-1 based language code to translate to.
    * @returns {Promise.<Object>} - Returns promise returning response from Messenger API.
    */
    multicast(recipient_ids, messages, language){
        // If messages is not array, we make it array.
        if (messages.length === undefined){
            messages = [messages];
        }

        let done_compile_messages = [];
        for (let message of messages){
            done_compile_messages.push(
                this.compile_message(message).then((compiled_message) => {
                    if (!this._messenger.translater){
                        // Auto translation is disabled so we won't translate.
                        debug("Translater is disabled so we won't translate.");
                        return compiled_message;
                    }

                    if (!language || language === this.options.language){
                        // Auto tranlsation is enabled but reciever's language is identical to bot's language so we don't have to tranaslate.
                        debug("Reciever's language is undefined or same as bot's language so we won't translate.");
                        return compiled_message;
                    }

                    debug(`Translating following message...`);
                    debug(compiled_message);

                    let message_type = this._messegner.Messenger_classes[this.type].identify_message_type(compiled_message);
                    return this._messenger.Messenger_classes[this.type].translate_message(this._messenger.translater, message_type, compiled_message, language);
                })
            );
        }
        let compiled_messages;
        return Promise.all(done_compile_messages).then((response) => {
            compiled_messages = response;
            return this._messenger.multicast(this._event, recipient_ids, compiled_messages);
        }).then((response) => {
            for (let compiled_message of compiled_messages){
                this._context.previous.message.unshift({
                    from: "bot",
                    message: compiled_message
                });
            }
            return response;
        });
    }

    /**
    * Queue messages. The messages will be sent out when reply(MESSAGES) function is called.
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to queue.
    * @returns {Null}
    */
    queue(messages){
        if (typeof this._context._message_queue == "undefined"){
            this._context._message_queue = [];
        }
        this._context._message_queue = this._context._message_queue.concat(messages);
    }

    /**
    * Stop processing final actions including collecting parameters and finish() and keep context.
    * @returns {Null}
    */
    pause(){
        this._context._pause = true;
    }

    /**
    Check parameter type.
    @private
    @param {String} key - Parameter name.
    @returns {String} "required_parameter" | "optional_parameter" | "dynamic_parameter" | "not_applicable"
    */
    check_parameter_type(key){
        if (!!this._context.skill.required_parameter && !!this._context.skill.required_parameter[key]){
            return "required_parameter";
        } else if (!!this._context.skill.optional_parameter && !!this._context.skill.optional_parameter[key]){
            return "optional_parameter";
        } else if (!!this._context.skill.dynamic_parameter && !!this._context.skill.dynamic_parameter[key]){
            return "dynamic_parameter";
        }
        return "not_applicable";
    }

    /**
    * Change the message to collect specified parameter.
    * @param {String} param_key - Name of the parameter to collect.
    * @param {MessageObject} message - The message object.
    * @returns {Null}
    */
    change_message_to_confirm(param_key, message){
        let param_type = this.check_parameter_type(param_key);

        if (param_type == "not_applicable"){
            debug("The parameter to change message not found.");
            throw new Error("The parameter to change message not found.")
        }

        this._context.skill[param_type][param_key].message_to_confirm = message;

        // Record this change.
        debug(`Saving change log to change_parameter_history...`);
        this._save_param_change_log(param_type, param_key, {message_to_confirm: message});
    }

    /**
    * Function to record the change log to revive this change into skill instance in the next event.
    @param {String} param_type - required_parameter | optional_parameter | dynamic_parameter
    @param {String} param_key - Name of the parameter.
    @param {Skill#skill_parameter} param - Skill parameter object.
    @return {Null}
    */
    _save_param_change_log(param_type, param_key, param){
        if (!this._context.param_change_history){
            this._context.param_change_history= [];
        }

        if (param.message_to_confirm){
            if (typeof param.message_to_confirm === "function"){
                param.message_to_confirm = param.message_to_confirm.toString();
            }
        }
        if (param.parser){
            param.parser = param.parser.toString();
        }
        if (param.reaction){
            param.reaction = param.reaction.toString();
        }

        this._context.param_change_history.unshift({
            type: param_type,
            key: param_key,
            param: param
        });
    }

    /**
    * Make the specified skill paramter being collected next.
    * @param {String|Skill#skill_parameter_container} arg - Name of the skill parameter or skill_parameter_container object to collect.
    * @returns {Null}
    */
    collect(arg){
        if (typeof arg == "string"){
            return this._collect_by_parameter_key(arg);
        } else if (typeof arg == "object"){
            return this._collect_by_parameter_obj(arg);
        } else {
            throw(new Error("Invalid argument for messenger.collect()"));
        }
    }

    /**
    * Collect specified parameter.
    * @private
    * @param {String} parameter_key - Name of the parameter to collect.
    * @returns {Null}
    */
    _collect_by_parameter_key(parameter_key){
        debug("Going to collect parameter. Message should be defined in skill.");

        // If there is confirmed parameter, we remove it to re-confirm.
        if (this._context.confirmed[parameter_key]){
            delete this._context.confirmed[parameter_key];
        }

        // If the parameter is already in the to_confirm list, we remove it to avoid duplicate.
        let index_to_remove = this._context.to_confirm.indexOf(parameter_key);
        if (index_to_remove !== -1){
            debug(`Removing ${parameter_key} from to_confirm.`);
            this._context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`We put parameter "${parameter_key}" to the top of to_confirm list.`);
        this._context.to_confirm.unshift(parameter_key);
    }

    /**
    * Collect specified parameter.
    * @private
    * @param {Skill#skill_parameter_container} param_container - The parameter container object to collect.
    * @returns {Null}
    */
    _collect_by_parameter_obj(param_container){
        debug("Going to collect parameter. Message should be enveloped in the argument.");

        if (Object.keys(param_container).length !== 1){
            throw("Malformed parameter container object. You can pass just 1 parameter.");
        }

        let param_key = Object.keys(param_container)[0];

        if (this._context.skill.required_parameter && this._context.skill.required_parameter[param_key]){
            // If we have parameter of same parameter key, override it.
            Object.assign(this._context.skill.required_parameter, param_container);
            this._save_param_change_log("required_parameter", param_key, param_container[param_key]);
        } else if (this._context.skill.optional_parameter && this._context.skill.optional_parameter[param_key]){
            // If we have parameter of same parameter key, override it.
            Object.assign(this._context.skill.optional_parameter, param_container);
            this._save_param_change_log("optional_parameter", param_key, param_container[param_key]);
        } else {
            // If we do not have parameter of same parameter key, add it as dynamic parameter.
            if (this._context.skill.dynamic_parameter === undefined) this._context.skill.dynamic_parameter = {};
            Object.assign(this._context.skill.dynamic_parameter, param_container);
            this._save_param_change_log("dynamic_parameter", param_key, param_container[param_key]);
        }

        // If there is confirmed parameter, we remove it to re-confirm.
        if (this._context.confirmed[param_key]){
            delete this._context.confirmed[param_key];
        }

        // If the parameter is already in the to_confirm list, we remove it to avoid duplicate.
        let index_to_remove = this._context.to_confirm.indexOf(param_key);
        if (index_to_remove !== -1){
            debug(`Removing ${param_key} from to_confirm.`);
            this._context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`We add dynamic parameter "${param_key}" to the top of to_confirm list.`);
        this._context.to_confirm.unshift(param_key);
    }


    /**
    * Extract message of the event.
    * @param {EventObject} event - Event to extract message.
    * @returns {MessageObject} - Extracted message.
    */
    extract_message(event = this._event){
        return this._messenger.extract_message(event);
    }

    /**
    * Extract message text.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted message text.
    */
    extract_message_text(event = this._event){
        return this._messenger.extract_message_text(event);
    }

    /**
    * Extract sender's user id.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted sender's user id.
    */
    extract_sender_id(event = this._event){
        return this._messenger.extract_sender_id(event);
    }

    /**
    * Extract session id.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted sender's user id.
    */
    extract_session_id(event = this._event){
        return this._messenger.extract_session_id(event);
    }

    /**
    * Identify the event type.
    * @param {EventObject} event - Event to identify event type.
    * @returns {String} - Event type. In case of LINE, it can be "message", "follow", "unfollow", "join", "leave", "postback", "beacon". In case of Facebook, it can be "echo", "message", "delivery", "read", "postback", "optin", "referral", "account_linking".
    */
    identify_event_type(event = this._event){
        return this._messenger.identify_event_type(event);
    }

    /**
    * Identify the message type.
    * @param {MessageObject} message - Message Object to identify message type.
    * @returns {String} - Message type. In case of LINE, it can be "text", "image", "audio", "video", "file", "location", "sticker", "imagemap", "buttons_template, "confirm_template" or "carousel_template". In case of Facebook, it can be "text", "image", "audio", "video", "file", "button_template", "generic_template", "list_template", "open_graph_template", "receipt_template", "airline_boardingpass_template", "airline_checkin_template", "airline_itinerary_template", "airline_update_template".
    */
    identify_message_type(message){
        if (!message){
            message = this.extract_message();
        }
        return this._messenger.identify_message_type(message);
    }

    /**
    * Compile message format to the specified format.
    * @param {MessageObject} message - Message object to compile.
    * @param {String} format - Target format to compile. It can be "line" or "facebook".
    * @returns {Promise.<MessageObject>} - Compiled message object.
    */
    compile_message(message, format = this.type){
        return this._messenger.compile_message(message, format);
    }
}
module.exports = Bot;
