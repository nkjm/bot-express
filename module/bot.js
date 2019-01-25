"use strict";

const debug = require("debug")("bot-express:bot");
const log = require("./logger");

/**
 * Toolkit to be used by skill.
 * @class
 * @prop {String} type - Type of messenger. The value can be "line","facebook" and "google".
 * @prop {String} language - ISO-639-1 based language code which is the mother language of this chatbot.
 * @prop {Object} translator - Translator instance.
 */
class Bot {
    /**
     * @constructor
     * @param {*} options 
     * @param {*} event 
     * @param {*} context 
     * @param {*} messenger 
     */
    constructor(options, event, context, messenger){
        this.type = messenger.type;
        this.language = options.language;
        for (let messenger_type of Object.keys(messenger.plugin)){
            this[messenger_type] = messenger.plugin[messenger_type];
        }
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
    async reply_to_collect(messages){
        return this.reply(messages, true)
    }

    /**
    * Reply message to sender. This function can be called just once in a flow. To send multiple messages, give multiple messages to this function or use queue(MESSAGES) function instead.
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to reply.
    * @returns {Promise.<Object>} - Returns promise returning response from Messenger API.
    */
    async reply(messages, to_collect = false){
        if (messages){
            this.queue(messages);
        }

        let done_compile_messages = [];
        for (let message of this._context._message_queue){
            done_compile_messages.push(
                // Compiling message.
                this._messenger.compile_message(message)
                /**
                @deprecated
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
                */
            );
        }

        let compiled_messages;
        return Promise.all(done_compile_messages).then((response) => {
            compiled_messages = response;
            if (this._event.type == "bot-express:push"){
                return this._messenger.send(this._event, this._event.to[`${this._event.to.type}Id`], compiled_messages);
            }
            if (to_collect || this._context._digging){
                return this._messenger.reply_to_collect(this._event, compiled_messages);
            }
            return this._messenger.reply(this._event, compiled_messages);
        }).then((response) => {
            for (let compiled_message of compiled_messages){
                this._context.previous.message.unshift({
                    from: "bot",
                    message: compiled_message
                });

                log.chat(this.extract_sender_id(), this._context.skill.type, "bot", compiled_message);
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
    async send(recipient_id, messages, language){
        // If messages is not array, we make it array.
        if (messages.length === undefined){
            messages = [messages];
        }

        let done_compile_messages = [];
        for (let message of messages){
            done_compile_messages.push(
                this.compile_message(message)
                /**
                @deprecated
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
                */
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

                log.chat(this.extract_sender_id(), this._context.skill.type, "bot", compiled_message);
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
    async multicast(recipient_ids, messages, language){
        // If messages is not array, we make it array.
        if (messages.length === undefined){
            messages = [messages];
        }

        let done_compile_messages = [];
        for (let message of messages){
            done_compile_messages.push(
                this.compile_message(message)
                /**
                @deprecated
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
                */
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

                log.chat(this.extract_sender_id(), this._context.skill.type, "bot", compiled_message);
            }
            return response;
        });
    }

    /**
     * Switch skill using provided intent. If this method is called in the middle of flow, rest of the process is skipped.
     * @param {intent} intent 
     */
    switch_skill(intent){
        this.exit();

        if (!(intent.name && typeof intent.name === "string")){
            throw new Error("Required parameter: 'name' for switch_skill() should be set and string.");
        }
        
        this._context._switch_intent = intent;
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
    * Stop processing all remaining actions and keep context.
    * @returns {Null}
    */
    pause(){
        this._context._pause = true;
    }

    /**
    * Stop processing all remaining actions and keep context except for confirming.
    * @returns {Null}
    */
    exit(){
        this._context._exit = true;
    }

    /**
    * Stop processing all remaining actions and clear context completely.
    * @returns {Null}
    */
    init(){
        this._context._init = true;
    }

    /**
    Check parameter type.
    @private
    @param {String} key - Parameter name.
    @returns {String} "required_parameter" | "optional_parameter" | "dynamic_parameter" | "not_applicable"
    */
    check_parameter_type(key){
        if (this._context.skill.required_parameter && this._context.skill.required_parameter[key]){
            return "required_parameter";
        } else if (this._context.skill.optional_parameter && this._context.skill.optional_parameter[key]){
            return "optional_parameter";
        } else if (this._context.skill.dynamic_parameter && this._context.skill.dynamic_parameter[key]){
            return "dynamic_parameter";
        } else if (this._context.confirming_property){
            return this._context.confirming_property.parameter_type;
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
    Manually apply value to the parameter. This will skip parser but still trigger reaction.
    @param {String} param_key - Name of the parameter to apply.
    @param {Any} value - Value to apply.
    @return {Promise}
    */
    async apply_parameter(param_key, value){
        const param_type = this.check_parameter_type(param_key);

        let param;
        if (this._context.confirming_property){
            param = this._context.skill[this._context.confirming_property.parameter_type][this._context.confirming_property.parameter_key].property[param_key];
        } else {
            param = this._context.skill[param_type][param_key];
        }
        
        if (param.list){
            if (!(typeof param.list === "boolean" || typeof param.list === "object")){
                throw new Error("list property should be boolean or object.");
            }
            if (this._context.confirming_property){
                if (!Array.isArray(this._context.confirming_property.confirmed[param_key])){
                    this._context.confirming_property.confirmed[param_key] = [];
                }
                if (param.list === true){
                    this._context.confirming_property.confirmed[param_key].unshift(value);
                } else if (param.list.order === "new"){
                    this._context.confirming_property.confirmed[param_key].unshift(value);
                } else if (param.list.order === "old"){
                    this._context.confirming_property.confirmed[param_key].push(value);
                } else {
                    this._context.confirming_property.confirmed[param_key].unshift(value);
                }
            } else {
                if (!Array.isArray(this._context.confirmed[param_key])){
                    this._context.confirmed[param_key] = [];
                }
                if (param.list === true){
                    this._context.confirmed[param_key].unshift(value);
                } else if (param.list.order === "new"){
                    this._context.confirmed[param_key].unshift(value);
                } else if (param.list.order === "old"){
                    this._context.confirmed[param_key].push(value);
                } else {
                    this._context.confirmed[param_key].unshift(value);
                }
            }
        } else {
            if (this._context.confirming_property){
                this._context.confirming_property.confirmed[param_key] = value;
            } else {
                this._context.confirmed[param_key] = value;
            }
        }

        // At the same time, add the parameter key to previously confirmed list. The order of this list is newest first.
        this._context.previous.confirmed.unshift(param_key);
        this._context.previous.processed.unshift(param_key);

        // Remove item from to_confirm if it exits.
        let index_to_remove = this._context.to_confirm.indexOf(param_key);
        if (index_to_remove !== -1){
            debug(`Removing ${param_key} from to_confirm.`);
            this._context.to_confirm.splice(index_to_remove, 1);
        }

        // Clear confirming.
        if (this._context.confirming === param_key){
            debug(`Clearing confirming.`);
            this._context.confirming = null;
        }

        if (param.reaction){
            debug(`Reaction for ${param_key} found. Performing reaction...`);
            return this._context.skill[param_type][param_key].reaction(false, value, this, this._event, this._context);
        } else if (this._context.skill["reaction_" + param_key]){
            debug(`Reaction for ${param_key} found. Performing reaction...`);
            return this._context.skill["reaction_" + param_key](false, value, this, this._event, this._context);
        } else {
            // This parameter does not have reaction so do nothing.
            debug(`Reaction for ${param_key} not found.`);
            return;
        }
    }

    /**
    * Function to record the change log to revive this change into skill instance in the next event.
    @param {String} param_type - required_parameter | optional_parameter | dynamic_parameter
    @param {String} param_key - Name of the parameter.
    @param {Skill#skill_parameter} param - Skill parameter object.
    @return {Null}
    */
    _save_param_change_log(param_type, param_key, param_orig){
        // We copy param_orig to param to prevent propagate the change in this function to original object.
        let param = Object.assign({}, param_orig);

        if (!this._context.param_change_history){
            this._context.param_change_history= [];
        }

        if (param.message_to_confirm){
            if (typeof param.message_to_confirm === "function"){
                param.message_to_confirm = param.message_to_confirm.toString();
            }
        }
        if (param.condition){
            if (typeof param.condition === "function"){
                param.condition = param.condition.toString();
            }
        }
        if (param.parser){
            if (typeof param.parser === "function"){
                param.parser = param.parser.toString();
            }
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
    * @param {Object} [options] - Option object.
    * @param {Boolean} [options.dedup=true] - Set false to allow collecting same parameter multiple times.
    * @returns {Null}
    */
    collect(arg, options = {}){
        if (options.dedup === undefined || options.dedup === null){
            options.dedup = true;
        }

        let parameter_key;

        if (typeof arg == "string"){
            debug(`Reserving collection of parameter: ${arg}.`);
            parameter_key = arg;
        } else if (typeof arg == "object"){
            if (Object.keys(arg).length !== 1){
                throw("Malformed parameter container object. You can pass just 1 parameter.");
            }

            debug(`Reserving collection of parameter: ${Object.keys(arg)[0]}.`);
            let parameter_container = arg;
            parameter_key = Object.keys(parameter_container)[0];
    
            if (this._context.skill.required_parameter && this._context.skill.required_parameter[parameter_key]){
                // If we have parameter of same parameter key, override it.
                debug(`Found the parameter in required_parameter so we override it.`);
                Object.assign(this._context.skill.required_parameter, parameter_container);
                this._save_param_change_log("required_parameter", parameter_key, parameter_container[parameter_key]);
            } else if (this._context.skill.optional_parameter && this._context.skill.optional_parameter[parameter_key]){
                // If we have parameter of same parameter key, override it.
                debug(`Found the parameter in optional_parameter so we override it.`);
                Object.assign(this._context.skill.optional_parameter, parameter_container);
                this._save_param_change_log("optional_parameter", parameter_key, parameter_container[parameter_key]);
            } else {
                // If we do not have parameter of same parameter key, add it as dynamic parameter.
                debug(`The parameter not found in skill so we add it as dynamic parameter.`);
                if (this._context.skill.dynamic_parameter === undefined) this._context.skill.dynamic_parameter = {};
                Object.assign(this._context.skill.dynamic_parameter, parameter_container);
                this._save_param_change_log("dynamic_parameter", parameter_key, parameter_container[parameter_key]);
            }
        } else {
            throw(new Error("Invalid argument."));
        }

        // If the parameter is already in the to_confirm list and dedup is true, we remove it to avoid duplicate.
        let index_to_remove = this._context.to_confirm.indexOf(parameter_key);
        if (index_to_remove !== -1 && options.dedup){
            debug(`We found this parameter has already been confirmed so remove ${parameter_key} from to_confirm to dedup.`);
            this._context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`Reserved collection of parameter: ${parameter_key}. We put it to the top of to_confirm list.`);
        this._context.to_confirm.unshift(parameter_key);
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
