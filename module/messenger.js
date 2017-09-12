'use strict';

let Line = require("./messenger/line");
let Facebook = require("./messenger/facebook");
let debug = require("debug")("bot-express:messenger");
let google_translate = require('@google-cloud/translate');
let fs = require("fs");

module.exports = class Messenger {
    /**
    * @constructs
    */
    constructor(options, bot_event){
        this.type = options.message_platform_type;
        this.options = options;
        this.Messenger_classes = {};
        this.context = null; // Will be set later in webhook
        this.bot_event = bot_event;
        this.skill = null; // Will be set in flow constructor
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
        return this.Messenger_classes[this.type].extract_beacon_event_type(this.bot_event);
    }

    extract_param_value(){
        return this.Messenger_classes[this.type].extract_param_value(this.bot_event);
    }

    check_supported_event_type(flow){
        return this.Messenger_classes[this.type].check_supported_event_type(flow, this.bot_event);
    }

    /**
    * Extract message of the event.
    * @param {EventObject} event - Event to extract message.
    * @returns {MessageObject} - Extracted message.
    */
    extract_message(event){
        return this.Messenger_classes[this.type].extract_message(event || this.bot_event);
    }

    /**
    * Extract message text of the event.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted message text.
    */
    extract_message_text(event){
        return this.Messenger_classes[this.type].extract_message_text(event || this.bot_event);
    }

    /**
    * Extract sender's user id.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String}
    */
    extract_sender_id(event){
        return this.Messenger_classes[this.type].extract_sender_id(event || this.bot_event);
    }

    /**
    * Identify the event type.
    * @param {EventObject} event - Event to identify event type.
    * @returns {String} - Event type. In case of LINE, it can be "message", "follow", "unfollow", "join", "leave", "postback", "beacon". In case of Facebook, it can be "echo", "message", "delivery", "read", "postback", "optin", "referral", "account_linking".
    */
    identify_event_type(event){
        return this.Messenger_classes[this.type].identify_event_type(event || this.bot_event);
    }

    /**
    * Identify the message type.
    * @param {MessageObject} message - Message object to identify message type.
    * @returns {String} In case of LINE, it can be "text", "image", "audio", "video", "file", "location", "sticker", "imagemap", "buttons_template, "confirm_template" or "carousel_template".
    * In case of Facebook, it can be "text", "image", "audio", "video", "file", "button_template", "generic_template", "list_template", "open_graph_template", "receipt_template", "airline_boardingpass_template", "airline_checkin_template", "airline_itinerary_template", "airline_update_template".
    */
    identify_message_type(message){
        if (!message){
            message = this.extract_message(this.bot_event);
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
                return this.service.reply(this.bot_event, compiled_messages);
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
                return this.service.send(this.bot_event, recipient_id, compiled_messages);
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
                return this.service.multicast(this.bot_event, recipient_ids, compiled_messages);
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
    * Collect specified parameter.
    * @param {String|SkillParameterObject} arg - Name of the parameter to collect or parameter object to collect.
    * @returns {Null}
    */
    collect(arg){
        if (typeof arg == "string"){
            return this._collect_by_parameter_name(arg);
        } else if (typeof arg == "object"){
            return this._collect_by_param(arg);
        } else {
            throw("Invalid argument for messenger.collect()");
        }
    }

    /**
    * Change the message to collect specified parameter.
    * @param {String} parameter_name - Name of the parameter to collect.
    * @param {MessageObject} message - The message object.
    * @returns {Null}
    */
    change_message_to_confirm(parameter_name, message){
        let param_index = this.context.to_confirm.findIndex(param => param.name === parameter_name);
        if (param_index === undefined){
            debug("The parameter to change message to confirm not found.");
            throw("The parameter to change message to confirm not found.");
        }
        this.context.to_confirm[param_index].message_to_confirm = message;
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
    * @private
    * @param {String} parameter_name - Name of the parameter to collect.
    * @returns {Null}
    */
    _collect_by_parameter_name(parameter_name){
        debug("Going to collect parameter. Message should be defined in skill.");

        let param_to_collect;
        if (!!this.skill.required_parameter && !!this.skill.required_parameter[parameter_name]){
            param_to_collect = {
                name: parameter_name,
                label: this.skill.required_parameter[parameter_name].label,
                message_to_confirm: this.skill.required_parameter[parameter_name].message_to_confirm,
                parser: this.skill.required_parameter[parameter_name].parser,
                reaction: this.skill.required_parameter[parameter_name].reaction
            }
        } else if (!!this.skill.optional_parameter && !!this.skill.optional_parameter[parameter_name]){
            param_to_collect = {
                name: parameter_name,
                label: this.skill.optional_parameter[parameter_name].label,
                message_to_confirm: this.skill.optional_parameter[parameter_name].message_to_confirm,
                parser: this.skill.optional_parameter[parameter_name].parser,
                reaction: this.skill.optional_parameter[parameter_name].reaction
            }
        } else {
            debug(`Spedified parameter not found in skill.`);
            throw(`Spedified parameter not found in skill.`);
        }

        if (this.context.confirmed[param_to_collect.name]){
            delete this.context.confirmed[param_to_collect.name];
        }

        let index_to_remove = this.context.to_confirm.findIndex(param => param.name === param_to_collect.name);
        if (index_to_remove !== -1){
            debug(`Removing ${param_to_collect.name} from to_confirm.`);
            this.context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`We add optional parameter "${parameter_name}" to the top of to_confirm list.`);
        this.context.to_confirm.unshift(param_to_collect);
    }

    /**
    * Collect specified parameter.
    * @private
    * @param {SkillParameterObject} parameter - The parameter object to collect.
    * @returns {Null}
    */
    _collect_by_param(parameter){
        debug("Going to collect parameter. Message should be enveloped in the argument.");

        if (Object.keys(parameter).length != 1){
            throw("Malformed parameter.");
        }

        // Add this param to skill as optional parameter since apply_parameter searches for param in skill.
        if (this.skill.optional_parameter === undefined) this.skill.optional_parameter = {};
        Object.assign(this.skill.optional_parameter, parameter);
        debug(this.skill);

        let param_to_collect = {
            name: Object.keys(parameter)[0],
            label: parameter[Object.keys(parameter)[0]].label,
            message_to_confirm: parameter[Object.keys(parameter)[0]].message_to_confirm,
            parser: parameter[Object.keys(parameter)[0]].parser,
            reaction: parameter[Object.keys(parameter)[0]].reaction
        }

        if (this.context.confirmed[param_to_collect.name]){
            delete this.context.confirmed[param_to_collect.name];
        }

        let index_to_remove = this.context.to_confirm.findIndex(param => param.name === param_to_collect.name);
        if (index_to_remove !== -1){
            debug(`Removing ${param_to_collect.name} from to_confirm.`);
            this.context.to_confirm.splice(index_to_remove, 1);
        }

        debug(`We add optional parameter "${param_to_collect.name}" to the top of to_confirm list.`);
        this.context.to_confirm.unshift(param_to_collect);
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
