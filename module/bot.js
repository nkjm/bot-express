"use strict";

const debug = require("debug")("bot-express:bot");
const Parser = require("./parser");
const Translator = require("./translator");

/**
 * Toolkit to be used by skill.
 * @class
 * @prop {String} type - Type of messenger. The value can be "line","facebook" and "google".
 * @prop {String} language - ISO-639-1 based language code which is the mother language of this chatbot.
 * @prop {Object} builtin_parser - Instance of builtin parser. You can use builtin parser like follows. await bot.builtin_parser.PARSER_NAME(value, policy).
 */
class Bot {
    /**
     * @constructor
     * @param {*} options 
     * @param {*} logger
     * @param {*} event 
     * @param {*} context 
     * @param {*} messenger{"chat_id":"7f78c6f3efd905f01f6b680ede4f069fc81a8a20","launched_at":1552622929931,"intent":{"id":"projects/ichikawa-fb8d3/agent/intents/28a4fab9-09b1-4ac5-93ff-7b926090ca47","name":"before-apply-juminhyo","parameters":{"juminhyo":"住民票"},"text_response":"","fulfillment":[],"dialogflow":{"responseId":"90bee398-170e-48b6-8ca3-6d9fa536019c","queryResult":{"fulfillmentMessages":[{"platform":"PLATFORM_UNSPECIFIED","text":{"text":[""]},"message":"text"}],"outputContexts":[],"queryText":"住民票を申請します","speechRecognitionConfidence":0,"action":"before-apply-juminhyo","parameters":{"fields":{"juminhyo":{"stringValue":"住民票","kind":"stringValue"}}},"allRequiredParamsPresent":true,"fulfillmentText":"","webhookSource":"","webhookPayload":null,"intent":{"inputContextNames":[],"events":[],"trainingPhrases":[],"outputContexts":[],"parameters":[],"messages":[],"defaultResponsePlatforms":[],"followupIntentInfo":[],"name":"projects/ichikawa-fb8d3/agent/intents/28a4fab9-09b1-4ac5-93ff-7b926090ca47","displayName":"juminhyo","priority":0,"isFallback":false,"webhookState":"WEBHOOK_STATE_UNSPECIFIED","action":"","resetContexts":false,"rootFollowupIntentName":"","parentFollowupIntentName":"","mlDisabled":false},"intentDetectionConfidence":1,"diagnosticInfo":null,"languageCode":"ja"},"webhookStatus":null}},"to_confirm":["proceed"],"confirming":"proceed","confirming_property":null,"confirmed":{},"heard":{"juminhyo":"住民票","line_pay":"LINE Pay"},"previous":{"event":{"type":"message","replyToken":"eff01c5fb78741e1a57dff647171dd07","source":{"userId":"U2e250c5c3b8d3af3aa7dd9ad34ed15f9","type":"user"},"timestamp":1552622936043,"message":{"type":"text","id":"9516795270439","text":"LINE Payの使い方"}},"confirmed":[],"processed":[],"message":[{"from":"bot","message":{"type":"text","text":"LINE PayはLINEアプリの中で規約に同意するだけで利用開始できます。利用開始したらまず残高をチャージ（入金）する必要があります。チャージはコンビ二の店頭でおこなうこともできますし、銀行口座を登録してオンラインでおこなうこともできます。\nhttps://youtu.be/0fchyGHtg60","quickReply":{"items":[{"type":"action","action":{"type":"message","text":"LINE Payの銀行口座でのチャージ方法","label":"銀行口座でのチャージ方法"}},{"type":"action","action":{"type":"message","label":"中止","text":"中止"}},{"type":"action","action":{"type":"message","label":"続行","text":"続行"}}]}}},{"from":"user","message":{"type":"text","id":"9516795270439","text":"LINE Payの使い方"}},{"from":"bot","message":{"type":"flex","altText":"住民票の申請はこちらのトークで申請内容をすべておうかがいし、費用（手数料・郵送料）はLINE Payで決済、最長で4開庁日以内に郵送で発送致します。よろしければ続行ボタンをタップしてお進みください。","contents":{"type":"bubble","body":{"type":"box","layout":"vertical","spacing":"xl","contents":[{"type":"text","text":"住民票の申請はこちらのトークで申請内容をすべておうかがいし、費用（手数料・郵送料）はLINE Payで決済、最長で4開庁日以内に郵送で発送致します。よろしければ続行ボタンをタップしてお進みください。","wrap":true},{"type":"box","layout":"vertical","contents":[{"type":"button","style":"link","height":"sm","action":{"type":"message","label":"申請できる住民票","text":"申請できる住民票"}},{"type":"button","style":"link","height":"sm","action":{"type":"message","label":"住民票を申請できる人","text":"住民票を申請できる人"}},{"type":"button","style":"link","height":"sm","action":{"type":"message","label":"住民票申請の料金","text":"住民票申請の料金"}},{"type":"button","style":"link","height":"sm","action":{"type":"message","label":"お問い合わせ先","text":"お問い合わせ先"}},{"type":"button","style":"link","height":"sm","action":{"type":"message","label":"LINE Payの使い方","text":"LINE Payの使い方"}}]}]}},"quickReply":{"items":[{"type":"action","action":{"type":"message","label":"中止","text":"中止"}},{"type":"action","action":{"type":"message","label":"続行","text":"続���"}}]}}},{"from":"user","message":{"type":"text","id":"9516794765660","text":"住民票を申請します"}}]},"sender_language":"ja","translation":null,"_digging":false,"skill":{},"_in_progress":false} 
     */
    constructor(options, logger, event, context, messenger){
        this.logger = logger;
        this.type = messenger.type;
        this.language = options.language;
        for (let messenger_type of Object.keys(messenger.plugin)){
            this[messenger_type] = messenger.plugin[messenger_type];
        }
        this.builtin_parser = new Parser(options.parser);
        this._options = options;
        this._event = event;
        this._context = context;
        this._messenger = messenger;
        this.translator = new Translator(this._context, this._options.translator);
    }

    /**
     * Alias to this.translator.t
     * @method
     * @async
     * @param {String} key
     * @param {Object} options
     * @return {String} Translation label.
     */
    async t(key, options){
        return this.translator.get_translation_label(key, options);
    }

    /**
    * Reply messages to sender to collect parameter
    * @method
    * @async
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @return {Object} - Response from Messenger API.
    */
    async reply_to_collect(messages){
        return this.reply(messages, true)
    }

    /**
    * Reply message to sender. This function can be called just once in a flow. To send multiple messages, give multiple messages to this function or use queue(MESSAGES) function instead.
    * @method
    * @async
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to reply.
    * @return {Object} - Response from Messenger API.
    */
    async reply(messages, to_collect = false){
        if (messages){
            this.queue(messages);
        }

        let done_compile_messages = [];
        for (let message of this._context._message_queue){
            done_compile_messages.push(this._messenger.compile_message(message));
        }

        const compiled_messages = await Promise.all(done_compile_messages);

        let response;
        if (this._event.type == "bot-express:push"){
            response = await this._messenger.send(this._event, this._event.to[`${this._event.to.type}Id`], compiled_messages);
        } else if (to_collect || this._context._digging){
            response = await this._messenger.reply_to_collect(this._event, compiled_messages);
        } else {
            response = await this._messenger.reply(this._event, compiled_messages);
        }

        for (let compiled_message of compiled_messages){
            this._context.previous.message.unshift({
                from: "bot",
                message: compiled_message,
                skill: this._context.skill.type
            });

            await this.logger.chat(this.extract_sender_id(), this._context.chat_id, this._context.skill.type, "bot", compiled_message);
        }
        this._context._message_queue = [];

        return response;
    }

    /**
    * Send(Push) message to specified user.
    * @method
    * @async
    * @param {String} recipient_id - Recipient user id.
    * @param {MessageObject|Array.<MessageObject>} messages - Messages object[s] to send.
    * @param {String} language - ISO-639-1 based language code to translate to.
    * @return {Object} - Response from Messenger API.
    */
    async send(recipient_id, messages, language){
        // If messages is not array, we make it array.
        if (messages.length === undefined){
            messages = [messages];
        }

        let done_compile_messages = [];
        for (let message of messages){
            done_compile_messages.push(this.compile_message(message));
        }

        const compiled_messages = await Promise.all(done_compile_messages);
        const response = await this._messenger.send(this._event, recipient_id, compiled_messages);

        for (let compiled_message of compiled_messages){
            this._context.previous.message.unshift({
                from: "bot",
                message: compiled_message,
                skill: this._context.skill.type
            });

            await this.logger.chat(this.extract_sender_id(), this._context.chat_id, this._context.skill.type, "bot", compiled_message);
        }

        return response;
    }

    /**
    * Send(Push) messages to multiple users.
    * @method
    * @async
    * @param {Array.<String>} recipient_ids - Array of recipent user id.
    * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to send.
    * @param {String} language - ISO-639-1 based language code to translate to.
    * @return {Object} - Response from Messenger API.
    */
    async multicast(recipient_ids, messages, language){
        // If messages is not array, we make it array.
        if (messages.length === undefined){
            messages = [messages];
        }

        let done_compile_messages = [];
        for (let message of messages){
            done_compile_messages.push(this.compile_message(message));
        }

        const compiled_messages = await Promise.all(done_compile_messages);
        const response = await this._messenger.multicast(this._event, recipient_ids, compiled_messages);

        for (let compiled_message of compiled_messages){
            this._context.previous.message.unshift({
                from: "bot",
                message: compiled_message,
                skill: this._context.skill.type
            });

            await this.logger.chat(this.extract_sender_id(), this._context.chat_id, this._context.skill.type, "bot", compiled_message);
        }

        return response;
    }

    /**
     * Switch skill using provided intent. If this method is called in the middle of flow, rest of the process is skipped.
     * @method
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
     * @method
     * @param {MessageObject|Array.<MessageObject>} messages - Message object[s] to queue.
     */
    queue(messages){
        if (typeof this._context._message_queue == "undefined"){
            this._context._message_queue = [];
        }
        this._context._message_queue = this._context._message_queue.concat(messages);
    }

    /**
     * Stop processing all remaining actions and keep context.
     * @method
     */
    pause(){
        this._context._pause = true;
    }

    /**
     * Stop processing all remaining actions and keep context except for confirming.
     * @method
     */
    exit(){
        this._context._exit = true;
    }

    /**
     * Stop processing all remaining actions and clear context completely.
     * @method
     */
    init(){
        this._context._init = true;
    }

    /**
     * Check parameter type.
     * @method
     * @param {String} key - Parameter name.
     * @returns {String} "required_parameter" | "optional_parameter" | "dynamic_parameter" | "not_applicable"
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
     * @method
     * @param {String} param_key - Name of the parameter to collect.
     * @param {MessageObject} message - The message object.
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
     * Manually apply value to the parameter. This will skip parser but still trigger reaction.
     * @method
     * @async
     * @param {String} param_key - Name of the parameter to apply.
     * @param {*} param_value - Value to apply.
     * @param {Boolean} [parse=false] - Whether to run parser.
     * @param {Boolean} [react=true] - Whether to run reaction.
     */ 
    async apply_parameter(param_key, param_value, parse = false, react = true){
        const param_type = this.check_parameter_type(param_key);

        // Parse parameter.
        let parse_error;
        if (parse){
            try {
                param_value = await this.parse_parameter(param_key, param_value);
            } catch (e){
                if (e.name === "Error"){
                    // This should be intended exception in parser.
                    parse_error = e;
                    debug(`Parser rejected following value for parameter: "${param_key}".`);
                    debug(param_value);
                    if (e.message){
                        debug(e.message);
                    }
                } else {
                    // This should be unexpected exception so we just throw error.
                    throw e;
                }
            }
        }

        // Add parameter to context.
        this.add_parameter(param_key, param_value);

        // Take reaction.
        if (react){
            await this.react(parse_error, param_key, param_value);
        }
    }

    /**
     * Run parser defined in skill.
     * @method
     * @async
     * @param {String} param_key - Parameter name.
     * @param {*} param_value - Value to validate.
     * @param {Boolean} [strict=false] - If true, reject if parser does not exist. This option is for imternal use.
     * @returns {*}
    */
    async parse_parameter(param_key, param_value, strict = false){
        debug(`Parsing following value for parameter "${param_key}"`);
        debug(JSON.stringify(param_value));

        const param_type = this.check_parameter_type(param_key);

        let param;
        if (this._context.confirming_property){
            param = this._context.skill[this._context.confirming_property.parameter_type][this._context.confirming_property.parameter_key].property[param_key];
        } else {
            param = this._context.skill[param_type][param_key];
        }

        let parser;
        if (param.parser){
            debug("Parse method found in parameter definition.");
            parser = param.parser;
        } else if (this._context.skill["parse_" + param_key]){
            debug("Parse method found in default parser function name.");
            parser = this._context.skill["parse_" + param_key];
        } else {
            if (strict){
                throw new Error("Parser not found.");
            }
            debug("Parse method NOT found. We use the value as it is as long as the value is set.");
            if (param_value === undefined || param_value === null || param_value === ""){
                throw new Error("Value is not set.");
            }
            debug(`Parser accepted the value.`);
            return param_value;
        }

        // As parser, we support 3 types which are function, string and object.
        // In case of function, we use it as it is.
        // In case of string and object, we use builtin parser.
        // As for the object, following is the format.
        // @param {Object} parser
        // @param {String} parser.type - Type of builtin parser. Supported value is dialogflow.
        // @param {String} parser.policy - Policy configuration depending on the each parser implementation.
        if (typeof parser === "function"){
            // We use the defined function.
            debug(`Parser is function so we use it as it is.`)
            return parser(param_value, this, this.event, this._context);
        } else if (typeof parser === "string"){
            // We use builtin parser.
            debug(`Parser is string so we use builtin parser: ${parser}.`);
            return this.builtin_parser[parser].parse(param_value, { parameter_name: param_key });
        } else if (typeof parser === "object"){
            // We use builtin parser.
            if (!parser.type){
                throw new Error(`Parser object is invalid. Required property: "type" not found.`);
            }
            debug(`Parser is object so we use builtin parser: ${parser.type}.`);

            // Add parameter_name to policy if it is not set.
            if (!parser.policy) parser.policy = {};
            parser.policy.parameter_name = parser.policy.parameter_name || param_key;

            return this.builtin_parser[parser.type].parse(param_value, parser.policy);
        } else {
            // Invalid parser.
            throw new Error(`Parser for the parameter: ${param_key} is invalid.`);
        }
    }


    /**
     * Add parameter to context as confirmed.
     * @method
     * @param {String} param_key 
     * @param {*} param_value 
     * @param {Boolean} [is_change]
     */
    add_parameter(param_key, param_value, is_change = false){
        const param_type = this.check_parameter_type(param_key);

        let param;
        if (this._context.confirming_property){
            param = this._context.skill[this._context.confirming_property.parameter_type][this._context.confirming_property.parameter_key].property[param_key];
        } else {
            param = this._context.skill[param_type][param_key];
        }

        // Add the parameter to context.confirmed.
        // If the parameter should be list, we add value to the list.
        // IF the parameter should not be list, we just set the value.
        if (param.list){
            if (!(typeof param.list === "boolean" || typeof param.list === "object")){
                throw new Error("list property should be boolean or object.");
            }
            if (this._context.confirming_property){
                if (!Array.isArray(this._context.confirming_property.confirmed[param_key])){
                    this._context.confirming_property.confirmed[param_key] = [];
                }
                if (param.list === true){
                    this._context.confirming_property.confirmed[param_key].unshift(param_value);
                } else if (param.list.order === "new"){
                    this._context.confirming_property.confirmed[param_key].unshift(param_value);
                } else if (param.list.order === "old"){
                    this._context.confirming_property.confirmed[param_key].push(param_value);
                } else {
                    this._context.confirming_property.confirmed[param_key].unshift(param_value);
                }
            } else {
                if (!Array.isArray(this._context.confirmed[param_key])){
                    this._context.confirmed[param_key] = [];
                }
                if (param.list === true){
                    this._context.confirmed[param_key].unshift(param_value);
                } else if (param.list.order === "new"){
                    this._context.confirmed[param_key].unshift(param_value);
                } else if (param.list.order === "old"){
                    this._context.confirmed[param_key].push(param_value);
                } else {
                    this._context.confirmed[param_key].unshift(param_value);
                }
            }
        } else {
            if (this._context.confirming_property){
                this._context.confirming_property.confirmed[param_key] = param_value;
            } else {
                this._context.confirmed[param_key] = param_value;
            }
        }

        // At the same time, add the parameter key to previously confirmed list. The order of this list is newest first.
        if (!is_change){
            this._context.previous.confirmed.unshift(param_key);
            this._context.previous.processed.unshift(param_key);
        }

        // Remove item from to_confirm.
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
    }

    /**
     * Run reaction defined in skill.
     * @method
     * @async
     * @param {Error} error
     * @param {String} param_key
     * @param {*} param_value
     */
    async react(error, param_key, param_value){
        // If pause or exit flag found, we skip remaining process.
        if (this._context._pause || this._context._exit || this._context._init){
            debug(`Detected pause or exit or init flag so we skip reaction.`);
            return;
        }

        const param_type = this.check_parameter_type(param_key);

        let param;
        if (this._context.confirming_property){
            param = this._context.skill[this._context.confirming_property.parameter_type][this._context.confirming_property.parameter_key].property[param_key];
        } else {
            param = this._context.skill[param_type][param_key];
        }

        if (param.reaction){
            debug(`Reaction for ${param_key} found. Performing reaction...`);
            await param.reaction(error, param_value, this, this.event, this._context);
        } else if (this._context.skill["reaction_" + param_key]){
            debug(`Reaction for ${param_key} found. Performing reaction...`);
            await this._context.skill["reaction_" + param_key](error, param_value, this, this.event, this._context);
        } else {
            // This parameter does not have reaction so do nothing.
            debug(`Reaction for ${param_key} not found.`);
            return;
        }
    }

    /**
     * Function to record the change log to revive this change into skill instance in the next event.
     * @method
     * @private
     * @param {String} param_type - required_parameter | optional_parameter | dynamic_parameter
     * @param {String} param_key - Name of the parameter.
     * @param {Skill#skill_parameter} param - Skill parameter object.
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
     * @method
     * @param {String|Skill#skill_parameter_container} arg - Name of the skill parameter or skill_parameter_container object to collect.
     * @param {Object} [options] - Option object.
     * @param {Boolean} [options.dedup=true] - Set false to allow collecting same parameter multiple times.
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
     * @method
     * @param {EventObject} event - Event to extract message.
     * @returns {MessageObject} - Extracted message.
     */
    extract_message(event = this._event){
        return this._messenger.extract_message(event);
    }

    /**
     * Extract message text.
     * @method
     * @param {EventObject} event - Event to extract message text.
     * @returns {String} - Extracted message text.
     */
    extract_message_text(event = this._event){
        return this._messenger.extract_message_text(event);
    }

    /**
    * Extract sender's user id.
    * @method
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted sender's user id.
    */
    extract_sender_id(event = this._event){
        return this._messenger.extract_sender_id(event);
    }

    /**
    * Extract session id.
    * @method
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted sender's user id.
    */
    extract_session_id(event = this._event){
        return this._messenger.extract_session_id(event);
    }

    /**
    * Identify the event type.
    * @method
    * @param {EventObject} event - Event to identify event type.
    * @returns {String} - Event type. In case of LINE, it can be "message", "follow", "unfollow", "join", "leave", "postback", "beacon". In case of Facebook, it can be "echo", "message", "delivery", "read", "postback", "optin", "referral", "account_linking".
    */
    identify_event_type(event = this._event){
        return this._messenger.identify_event_type(event);
    }

    /**
    * Identify the message type.
    * @method
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
    * @method
    * @param {MessageObject} message - Message object to compile.
    * @param {String} format - Target format to compile. It can be "line" or "facebook".
    * @returns {Promise.<MessageObject>} - Compiled message object.
    */
    compile_message(message, format = this.type){
        return this._messenger.compile_message(message, format);
    }
}
module.exports = Bot;
