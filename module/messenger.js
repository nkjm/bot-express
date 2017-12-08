"use strict";

const debug = require("debug")("bot-express:messenger");
const google_translate = require('@google-cloud/translate');
const fs = require("fs");

module.exports = class Messenger {
    /**
    * @constructs
    */
    constructor(options, event){
        this.type = options.message_platform_type;
        this.options = options;
        this.Messenger_classes = {};
        this.context = null; // Will be set later in flow.
        this.event = event;
        this.plugin = {};

        // Load messenger libraries located under messenger directory.
        let messenger_scripts = fs.readdirSync(__dirname + "/messenger");
        for (let messenger_script of messenger_scripts){
            debug("Loading " + messenger_script + "...");
            messenger_script = messenger_script.replace(".js", "");
            this.Messenger_classes[messenger_script] = require("./messenger/" + messenger_script);
            this.plugin[messenger_script] = new this.Messenger_classes[messenger_script](options);
        }
        this.service = new this.Messenger_classes[this.type](options);

        // Instantiates a translater
        if (this.options.google_project_id && this.options.auto_translation == "enable"){
            this.translater = google_translate({
                projectId: this.options.google_project_id
            });
        }
    }

    validate_signature(req){
        return this.service.validate_signature(req);
    }

    extract_events(body){
        return this.Messenger_classes[this.type].extract_events(body);
    }

    extract_beacon_event_type(){
        return this.Messenger_classes[this.type].extract_beacon_event_type(this.event);
    }

    extract_param_value(){
        return this.Messenger_classes[this.type].extract_param_value(this.event);
    }

    check_supported_event_type(flow){
        return this.Messenger_classes[this.type].check_supported_event_type(flow, this.event);
    }

    /**
    * Extract message of the event.
    * @param {EventObject} event - Event to extract message.
    * @returns {MessageObject} - Extracted message.
    */
    extract_message(event){
        return this.Messenger_classes[this.type].extract_message(event || this.event);
    }

    /**
    * Extract message text of the event.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted message text.
    */
    extract_message_text(event){
        return this.Messenger_classes[this.type].extract_message_text(event || this.event);
    }

    /**
    * Extract sender's user id.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String}
    */
    extract_sender_id(event){
        return this.Messenger_classes[this.type].extract_sender_id(event || this.event);
    }

    /**
    * Identify the event type.
    * @param {EventObject} event - Event to identify event type.
    * @returns {String} - Event type. In case of LINE, it can be "message", "follow", "unfollow", "join", "leave", "postback", "beacon". In case of Facebook, it can be "echo", "message", "delivery", "read", "postback", "optin", "referral", "account_linking".
    */
    identify_event_type(event){
        return this.Messenger_classes[this.type].identify_event_type(event || this.event);
    }

    /**
    * Identify the message type.
    * @param {MessageObject} message - Message object to identify message type.
    * @returns {String} In case of LINE, it can be "text", "image", "audio", "video", "file", "location", "sticker", "imagemap", "buttons_template, "confirm_template" or "carousel_template".
    * In case of Facebook, it can be "text", "image", "audio", "video", "file", "button_template", "generic_template", "list_template", "open_graph_template", "receipt_template", "airline_boardingpass_template", "airline_checkin_template", "airline_itinerary_template", "airline_update_template".
    */
    identify_message_type(message){
        if (!message){
            message = this.extract_message(this.event);
        }
        return this.Messenger_classes[this.type].identify_message_type(message);
    }

    /**
    * Reply messages to sender.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Array.<Promise>}
    */
    reply(messages = null){
        if (messages){
            this.queue(messages);
        }
        let messages_compiled = [];
        for (let message of this.context._message_queue){
            messages_compiled.push(this.compile_message(message));
        }
        let compiled_messages;
        return Promise.all(messages_compiled).then(
            (response) => {
                compiled_messages = response;
                return this.service.reply(this.event, compiled_messages);
            }
        ).then(
            (response) => {
                for (let compiled_message of compiled_messages){
                    this.context.previous.message.unshift({
                        from: "bot",
                        message: compiled_message
                    });
                }
                this.context._message_queue = [];
                return response;
            }
        );
    }

    /**
    * Send(Push) message to specified user.
    * @param {String} recipient_id - Recipient user id.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Array.<Promise>}
    */
    send(recipient_id, messages){
        // If messages is not array, we make it array.
        if (messages.length === undefined){
            messages = [messages];
        }

        let messages_compiled = [];
        for (let message of messages){
            messages_compiled.push(this.compile_message(message));
        }
        let compiled_messages;
        return Promise.all(messages_compiled).then(
            (response) => {
                compiled_messages = response;
                return this.service.send(this.event, recipient_id, compiled_messages);
            }
        ).then(
            (response) => {
                for (let compiled_message of compiled_messages){
                    this.context.previous.message.unshift({
                        from: "bot",
                        message: compiled_message
                    });
                }
                return response;
            }
        );
    }

    /**
    * Push messages to multiple users.
    * @param {Array.<String>} recipient_ids - The array of recipent user id.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Array.<Promise>}
    */
    multicast(recipient_ids, messages){
        // If messages is not array, we make it array.
        if (messages.length === undefined){
            messages = [messages];
        }

        let messages_compiled = [];
        for (let message of messages){
            messages_compiled.push(this.compile_message(message));
        }
        let compiled_messages;
        return Promise.all(messages_compiled).then(
            (response) => {
                compiled_messages = response;
                return this.service.multicast(this.event, recipient_ids, compiled_messages);
            }
        ).then(
            (response) => {
                for (let compiled_message of compiled_messages){
                    this.context.previous.message.unshift({
                        from: "bot",
                        message: compiled_message
                    });
                }
                return response;
            }
        );
    }

    /**
    * Queue messages. The messages will be sent out when reply(MESSAGES) function is called.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Null}
    */
    queue(messages){
        if (typeof this.context._message_queue == "undefined"){
            this.context._message_queue = [];
        }
        this.context._message_queue = this.context._message_queue.concat(messages);
    }

    /**
    * Stop processing final actions including collecting parameters and finish() and keep context.
    * @returns {Null}
    */
    pause(){
        this.context._pause = true;
    }

    /**
    * Change the message to collect specified parameter.
    * @param {String} parameter_key - Name of the parameter to collect.
    * @param {MessageObject} message - The message object.
    * @returns {Null}
    */
    change_message_to_confirm(parameter_key, message){
        let param_type;
        if (!!this.context.skill.required_parameter && !!this.context.skill.required_parameter[parameter_key]){
            param_type = "required_parameter";
        } else if (!!this.context.skill.optional_parameter && !!this.context.skill.optional_parameter[parameter_key]){
            param_type = "optional_parameter";
        } else if (!!this.context.skill.dynamic_parameter && !!this.context.skill.dynamic_parameter[parameter_key]){
            param_type = "dynamic_parameter";
        } else {
            param_type = "not_applicable";
        }

        if (param_type == "not_applicable"){
            debug("The parameter to change message not found.");
            throw new Error("The parameter to change message not found.")
        }

        this.context.skill[param_type][parameter_key].message_to_confirm = message;
    }

    /**
    * Compile message format to the specified format.
    * @param {MessageObject} message - Message object to compile.
    * @param {String} format - Target format to compile. It can be "line" or "facebook".
    * @returns {Promise.<MessageObject>} - Compiled message object.
    */
    compile_message(message, format = this.type){
        let source_format = this._identify_message_format(message);
        debug(`Identified message format is ${source_format}.`);

        let compiled_message;

        if (format != source_format){
            debug(`Compiling message from ${source_format} to ${format}...`);

            // Identify message type.
            let message_type = this.Messenger_classes[source_format].identify_message_type(message);
            debug(`message type is ${message_type}`);

            // Compile message
            compiled_message = this.Messenger_classes[format].compile_message(source_format, message_type, message);
            debug(`Compiled message is following.`);
            debug(compiled_message);
        } else {
            compiled_message = JSON.parse(JSON.stringify(message));
            debug(`Compiled message is following.`);
            debug(compiled_message);
        }

        if (this.translater){
            let sender_language = this.context.sender_language;
            let bot_language = this.options.nlp_options.language;
            if (sender_language && (sender_language != bot_language)){
                debug(`Translating following message...`);
                debug(compiled_message);

                let message_type = this.Messenger_classes[this.type].identify_message_type(compiled_message);
                return this.Messenger_classes[this.type].translate_message(this.translater, message_type, compiled_message, sender_language);
            }
        }
        return Promise.resolve(compiled_message);
    }


    /**
    * Collect specified parameter.
    * @param {String|SkillParameterObject} arg - Name of the parameter to collect or parameter object to collect.
    * @returns {Null}
    */
    collect(arg){
        if (typeof arg == "string"){
            return this._collect_by_parameter_key(arg);
        } else if (typeof arg == "object"){
            return this._collect_by_parameter_obj(arg);
        } else {
            throw("Invalid argument for messenger.collect()");
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
        if (this.context.confirmed[parameter_key]){
            delete this.context.confirmed[parameter_key];
        }

        // If the parameter is already in the to_confirm list, we remove it to avoid duplicate.
        let index_to_remove = this.context.to_confirm.indexOf(parameter_key);
        if (index_to_remove !== -1){
            debug(`Removing ${parameter_key} from to_confirm.`);
            this.context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`We add optional parameter "${parameter_key}" to the top of to_confirm list.`);
        this.context.to_confirm.unshift(parameter_key);
    }

    /**
    * Collect specified parameter.
    * @private
    * @param {SkillParameterObject} parameter - The parameter object to collect.
    * @returns {Null}
    */
    _collect_by_parameter_obj(parameter){
        debug("Going to collect parameter. Message should be enveloped in the argument.");

        if (Object.keys(parameter).length != 1){
            throw("Malformed parameter.");
        }

        let param_key = Object.keys(parameter)[0];

        if (this.context.skill.required_parameter && this.context.skill.required_parameter[param_key]){
            // If we have parameter of same parameter key, override it.
            Object.assign(this.context.skill.required_parameter, parameter);
        } else if (this.context.skill.optional_parameter && this.context.skill.optional_parameter[param_key]){
            // If we have parameter of same parameter key, override it.
            Object.assign(this.context.skill.optional_parameter, parameter);
        } else {
            // If we do not have parameter of same parameter key, add it as dynamic parameter.
            if (this.context.skill.dynamic_parameter === undefined) this.context.skill.dynamic_parameter = {};
            Object.assign(this.context.skill.dynamic_parameter, parameter);
        }

        // If there is confirmed parameter, we remove it to re-confirm.
        if (this.context.confirmed[param_key]){
            delete this.context.confirmed[param_key];
        }

        // If the parameter is already in the to_confirm list, we remove it to avoid duplicate.
        let index_to_remove = this.context.to_confirm.indexOf(param_key);
        if (index_to_remove !== -1){
            debug(`Removing ${param_key} from to_confirm.`);
            this.context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`We add dynamic parameter "${param_key}" to the top of to_confirm list.`);
        this.context.to_confirm.unshift(param_key);
    }

    /**
    * Identify the message format.
    * @private
    * @param {MessageObject} message - Message object to identify message format.
    * @returns {String} - Message format.
    */
    _identify_message_format(message){
        let message_format;
        if (!!message.type){
            message_format = "line";
        } else {
            let message_keys = Object.keys(message).sort();
            if (!!message.quick_replies || !!message.attachment || !!message.text){
                // Provider is facebook. Type is quick reply.
                message_format = "facebook";
            }
        }
        if (!message_format){
            // We could not identify the format of this message object.
            throw new Error(`We can not identify the format of this message object.`);
        }
        return message_format;
    }

}
