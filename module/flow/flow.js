"use strict";

const debug = require("debug")("bot-express:flow");
const log = require("../logger");
const Bot = require("../bot"); // Libraries to be exposed to skill.
const Nlu = require("../nlu");
const Translator = require("../translator");
const Parser = require("../parser");

module.exports = class Flow {
    constructor(messenger, event, context, options){
        this.context = context;
        this.event = event;
        this.options = options;
        this.messenger = messenger;
        this.bot = new Bot(this.options, this.event, this.context, messenger);
        if (this.options.translator){
            this.translator = new Translator(this.options.translator);
            this.bot.translator = this.translator;
        }
        this.builtin_parser = new Parser(this.options.parser);

        if (this.context.intent && this.context.intent.name){
            debug(`Init and reviving skill instance.`);
            this.context.skill = this.revive_skill(this.instantiate_skill(this.context.intent.name));

            // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
            // After that, we depend on context.to_confirm to identify to_confirm parameters.
            if (this.context.to_confirm.length == 0){
                this.context.to_confirm = this.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
            }
            debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);
        }
    }

    instantiate_skill(intent){
        if (!intent){
            debug("Intent should have been set but not.");
            return;
        }

        let skill;
        // If the intent is not identified, we use skill.default.
        if (intent == this.options.default_intent){
            skill = this.options.skill.default;
        } else {
            skill = intent;
        }

        let skill_instance;

        if (skill == "builtin_default"){
            debug("Use built-in default skill.");
            let skill_class = require("../skill/default");
            skill_instance = new skill_class();
        } else {
            debug(`Look for ${skill} skill.`);
            try {
                require.resolve(`${this.options.skill_path}${skill}`);
            } catch (e){
                debug(`Skill: "${skill}" not found.`)
                return;
            }

            debug(`Found skill: "${skill}".`);
            let skill_class = require(`${this.options.skill_path}${skill}`);
            skill_instance = new skill_class();
        }

        skill_instance.type = skill;

        return skill_instance;
    }

    identify_to_confirm_parameter(required_parameter, confirmed){
        let to_confirm = []; // Array of parameter names.

        // If there is no required_parameter, we just return empty array.
        if (!required_parameter){
            return to_confirm;
        }

        // Scan confirmed parameters and if missing required parameters found, we add them to to_confirm.
        for (let req_param_key of Object.keys(required_parameter)){
            if (typeof confirmed[req_param_key] == "undefined"){
                to_confirm.push(req_param_key);
                /*
                to_confirm.push({
                    name: req_param_key,
                    label: required_parameter[req_param_key].label,
                    message_to_confirm: required_parameter[req_param_key].message_to_confirm,
                    parser: required_parameter[req_param_key].parser,
                    reaction: required_parameter[req_param_key].reaction
                });
                */
            }
        }
        return to_confirm;
    }


    /**
    * Function to revive skill instance from change log.
    @param {Object} - Skill instance.
    @return {Object} - Revived skill instance.
    */
    revive_skill(skill){
        if (!skill){
            throw new Error("Skill not found.");
        }
        if (!this.context.param_change_history || this.context.param_change_history.length === 0){
            return skill;
        }

        this.context.param_change_history.forEach((log) => {
            if (log.param.message_to_confirm){
                if (typeof log.param.message_to_confirm === "string"){
                    debug(`message_to_confirm is string. We try to make it function...`);
                    try {
                        log.param.message_to_confirm = Function.call(this, "return " + log.param.message_to_confirm)();
                    } catch (error) {
                        debug(`message_to_confirm looks like just a string so we use it as it is.`);
                    }
                }
            }
            if (log.param.parser){
                if (typeof log.param.parser === "string"){
                    debug(`parser is string. We try to make it function...`);
                    try {
                        log.param.parser = Function.call(this, "return " + log.param.parser)();
                    } catch (error) {
                        debug(`parser looks like built-in parser so we use it as it is.`);
                    }
                }
            }
            if (log.param.reaction){
                log.param.reaction = Function.call(this, "return " + log.param.reaction)();
            }

            if (log.type === "dynamic_parameter" && skill.dynamic_parameter === undefined){
                skill.dynamic_parameter = {};
                skill.dynamic_parameter[log.key] = log.param;
                return;
            }
            if (skill[log.type][log.key] === undefined){
                skill[log.type][log.key] = log.param;
                return;
            }
            Object.assign(skill[log.type][log.key], log.param);
        })

        return skill;
    }

    /**
    Check if the intent is related to the parameter.
    @param {String} param - Name of the parameter.
    @param {String} intent - Name of the intent.
    @returns {Boolean} Returns true if it is related. Otherwise, false.
    */
    is_intent_related_to_param(param, intent){
        return false;
    }

    /**
     * Send/reply to user to ask to_confirm parameter.
     * @method
     * @return {Promise}
     */
    async _collect(){
        if (this.context.to_confirm.length == 0){
            debug("While collect() is called, there is no parameter to confirm.");
            return;
        }

        let message;
        let param_key = this.context.to_confirm[0];
        let param_type = this.bot.check_parameter_type(param_key);

        if (!this.context.skill[param_type]){
            throw new Error(`${param_type} parameter not found in skill.`);
        }

        if (!this.context.skill[param_type][param_key]){
            throw new Error(`Parameter: "${param_key}" not found in skill.`);
        }

        if (!this.context.skill[param_type][param_key].message_to_confirm){
            throw new Error("While we need to send a message to confirm parameter, the message not found.");
        }

        if (this.context.skill[param_type][param_key].message_to_confirm[this.bot.type]){
            // Found message platform specific message object.
            debug("Found messenger specific message object.");
            message = this.context.skill[param_type][param_key].message_to_confirm[this.bot.type];
        } else if (this.context.skill[param_type][param_key].message_to_confirm){
            // We compile this message object to get message platform specific message object.
            message = this.context.skill[param_type][param_key].message_to_confirm;
        }

        let message_to_confirm;
        if (typeof message === "function"){
            debug("message_to_confirm is made of function. We generate message with it.");
            message_to_confirm = await message(this.bot, this.event, this.context);
        } else if (typeof message === "object" || typeof message === "string"){
            debug("message_to_confirm is made of object|string. We use it as it is.");
            message_to_confirm = message;
        } else {
            throw new Error("Format of message_to_confirm is invalid.");
        }

        // Set confirming.
        this.context.confirming = param_key;

        // Send question to the user.
        if (!(typeof message_to_confirm === "object" && message_to_confirm.length)){
            // The message is single object so we make it array.
            message_to_confirm = [message_to_confirm];
        }
        if (this.context._flow == "push"){
            debug("We use send method to collect parameter since this is push flow.");
            debug("Reciever userId is " + this.event.to[`${this.event.to.type}Id`]);
            await this.bot.send(this.event.to[`${this.event.to.type}Id`], message_to_confirm, this.context.sender_language);
        } else {
            debug("We use reply method to collect parameter.");
            await this.bot.reply_to_collect(message_to_confirm);
        }
    }

    change_parameter(key, value){
        return this.apply_parameter(key, value, true);
    }

    /**
     * Apply parameter. Use _parse_parameter and _add_parameter inside.
     * @method
     * @param {String} key
     * @param {*} value
     * @param {Boolean} is_change
     * @return {Object} key: {String}, value: {*}
     */
    async apply_parameter(key, value, is_change = false){
        debug(`Applying parameter.`);

        let parameter_type = this.bot.check_parameter_type(key);
        if (parameter_type == "not_applicable"){
            debug("This is not the parameter we should care about. We just skip this.");
            return;
        }
        debug(`Parameter type is ${parameter_type}`);

        let parsed_value;
        try {
            parsed_value = await this._parse_parameter(parameter_type, key, value);
        } catch (e) {
            debug(`Parser rejected following value for parameter: "${key}".`);
            debug(JSON.stringify(value));
            if (e.message){
                debug(e.message);
            }
            throw(e);
        }

        debug(`Parser accepted the value. Parsed value for parameter: "${key}" follows.`);
        debug(JSON.stringify(parsed_value));

        this._add_parameter(key, parsed_value, is_change);

        debug(`We have now ${this.context.to_confirm.length} parameters to confirm.`);

        return {
            key: key,
            value: parsed_value
        }
    }

    /**
    Validate the value against the specified parameter.
    @private
    @param {String} type - Parameter type. Acceptable values are "required_parameter" or "optional_parameter".
    @param {String} key - Parameter name.
    @param {String|Object} value - Value to validate.
    @param {Boolean} strict - Flag to specify if parser has to exist. If set to true, this function reject the value when parser not found.
    @returns {Promise.<String|Object>}
    */
    async _parse_parameter(type, key, value, strict = false){
        debug(`Parsing following value for parameter "${key}"`);
        debug(JSON.stringify(value));

        let parser;
        if (!!this.context.skill[type][key].parser){
            debug("Parse method found in parameter definition.");
            parser = this.context.skill[type][key].parser;
        } else if (!!this.context.skill["parse_" + key]){
            debug("Parse method found in default parser function name.");
            parser = this.context.skill["parse_" + key];
        } else {
            if (strict){
                throw new Error("Parser not found.");
            }
            debug("Parse method NOT found. We use the value as it is as long as the value is set.");
            if (value === undefined || value === null || value === ""){
                throw new Error("Value is not set.");
            } else {
                return value;
            }
        }

        /**
        As parser, we support 3 types which are function, string and object.
        In case of function, we use it as it is.
        In case of string and object, we use builtin parser.
        As for the object, following is the format.
        @param {Object} parser
        @param {String} parser.type - Type of builtin parser. Supported value is dialogflow.
        @param {String} parser.policy - Policy configuration depending on the each parser implementation.
        */
        if (typeof parser === "function"){
            // We use the defined function.
            debug(`Parser is function so we use it as it is.`)
            return parser(value, this.bot, this.event, this.context);
        } else if (typeof parser === "string"){
            // We use builtin parser.
            debug(`Parser is string so we use builtin parser: ${parser}.`);
            return this.builtin_parser.parse(parser, {key: key, value: value}, {});
        } else if (typeof parser === "object"){
            // We use builtin parser.
            if (!parser.type){
                throw new Error(`Parser object is invalid. Required property: "type" not found.`);
            }
            debug(`Parser is object so we use builtin parser: ${parser.type}.`);
            return this.builtin_parser.parse(parser.type, {key: key, value: value}, parser.policy);
        } else {
            // Invalid parser.
            throw new Error(`Parser for the parameter: ${key} is invalid.`);
        }
    }

    _add_parameter(key, value, is_change = false){
        // Add the parameter to "confirmed".
        let param = {};
        param[key] = value;
        Object.assign(this.context.confirmed, param); // TBD: Can't we change this to just assigning property?

        // At the same time, add the parameter key to previously confirmed list. The order of this list is newest first.
        if (!is_change){
            this.context.previous.confirmed.unshift(key);
        }

        // Remove item from to_confirm.
        let index_to_remove = this.context.to_confirm.indexOf(key);
        if (index_to_remove !== -1){
            debug(`Removing ${key} from to_confirm.`);
            this.context.to_confirm.splice(index_to_remove, 1);
        }

        // Clear confirming.
        if (this.context.confirming == key){
            debug(`Clearing confirming.`);
            this.context.confirming = null;
        }
    }

    /**
     * Method to execute reaction.
     * @method
     * @param {Error} error
     * @param {String} key
     * @param {*} value
     */
    async react(error, key, value){
        // If pause or exit flag found, we skip remaining process.
        if (this.context._pause || this.context._exit || this.context._init){
            debug(`Detected pause or exit or init flag so we skip reaction.`);
            return;
        }

        let param_type = this.bot.check_parameter_type(key);

        if (this.context.skill[param_type] && this.context.skill[param_type][key]){
            if (this.context.skill[param_type][key].reaction){
                debug(`Reaction for ${key} found. Performing reaction...`);
                await this.context.skill[param_type][key].reaction(error, value, this.bot, this.event, this.context);
            } else if (this.context.skill["reaction_" + key]){
                debug(`Reaction for ${key} found. Performing reaction...`);
                await this.context.skill["reaction_" + key](error, value, this.bot, this.event, this.context);
            } else {
                // This parameter does not have reaction so do nothing.
                debug(`Reaction for ${key} not found.`);
                return;
            }
        } else {
            debug(`There is no parameter we should care about. So skip reaction.`);
            return;
        }
    }

    /**
    Identify what the user has in mind.
    @param {String|MessageObject} payload - Data from which we try to identify what the user like to achieve.
    @returns {Object} response
    @returns {String} response.result - "dig", "restart_conversation", "change_intent", "change_parameter" or "no_idea"
    @returns {Object} response.intent - Intent object.
    @returns {String|MessageObject} payload - Passed payload.
    @returns {Object} response.parameter - Parameter.
    @returns {String} response.parameter.key - Parameter name.
    @returns {String|Object} response.parameter.value - Parameter value.
    */
    async identify_mind(payload){
        debug(`Going to identify mind.`);

        // Check if this is intent postback
        if (typeof payload === "object"){
            if (payload.data){
                let parsed_data;
                try {
                    parsed_data = JSON.parse(payload.data);
                } catch(e) {
                    debug(`Postback payload.data is not JSON format so this is not intent postback.`);
                }

                if (typeof parsed_data == "object" && parsed_data._type == "intent"){
                    debug(`This is intent postback.`);
                    if (!parsed_data.intent || !parsed_data.intent.name){
                        throw new Error(`It seems this is intent postback but intent is not set or invalid.`);
                    }

                    if (parsed_data.intent.name === this.context.intent.name){
                        debug(`This is restart conversation.`);
                        return {
                            result: "restart_conversation",
                            intent: parsed_data.intent,
                            payload: payload
                        }
                    } else {
                        debug(`This is change intent.`);
                        return {
                            result: "change_intent",
                            intent: parsed_data.intent,
                            payload: payload
                        }
                    }
                }
            }
        }

        let intent;
        if (typeof payload !== "string"){
            debug("The payload is not string so we skip identifying intent.");
            return {
                result: "no_idea",
                intent: {
                    name: this.options.default_intent
                }
            }
        }

        debug("Going to check if we can identify the intent.");
        let nlu = new Nlu(this.options.nlu);
        intent = await nlu.identify_intent(payload, {
            session_id: this.bot.extract_session_id(),
            language: this.context.sender_language
        });

        if (this.options.modify_previous_parameter_intent && intent.name === this.options.modify_previous_parameter_intent){
            // This is modify previous parameter.
            debug(`We conclude this is modify previous parameter.`);
            return {
                result: "modify_previous_parameter",
                intent: intent,
                payload: payload
            }
        } else if (intent.name != this.options.default_intent){
            try {
                require.resolve(`${this.options.skill_path}${intent.name}`);
            } catch (e){
                // This is no idea.
                debug(`We conclude this is no idea since skill: "${intent.name}" not found.`);
                return {
                    result: "no_idea",
                    intent: this.context.intent
                }
            }

            // This is dig or change intent or restart conversation.

            // Check if this is dig.
            if (this.context._flow == "reply" && this.context.confirming){
                let param_type = this.bot.check_parameter_type(this.context.confirming);

                // Check if sub skill is configured in the confirming parameter.
                if (this.context.skill[param_type][this.context.confirming].sub_skill &&
                    this.context.skill[param_type][this.context.confirming].sub_skill.indexOf(intent.name) !== -1){
                    // This is dig.
                    debug("We conclude this is dig.");
                    return {
                        result: "dig",
                        intent: intent,
                        payload: payload
                    }
                }
            }

            // Check if this is restart conversation.
            if (intent.name == this.context.intent.name){
                // This is restart conversation.
                debug("We conclude this is restart conversation.");
                return {
                    result: "restart_conversation",
                    intent: intent,
                    payload: payload
                }
            }

            // This is change intent.
            debug("We conclude this is change intent.");
            return {
                result: "change_intent",
                intent: intent,
                payload: payload
            }
        }

        // This can be change parameter or no idea.
        debug("We could not identify intent so this can be change parameter or no idea.");

        if (this.context._flow === "reply"){
            debug(`Since this is in reply flow, we will not check if it is change parameter. We conclude this is no idea.`);
            return {
                result: "no_idea",
                intent: intent
            }
        }

        let is_fit = false;
        let all_param_keys = [];
        if (this.context.skill.required_parameter){
            all_param_keys = all_param_keys.concat(Object.keys(this.context.skill.required_parameter));
        }
        if (this.context.skill.optional_parameter){
            all_param_keys = all_param_keys.concat(Object.keys(this.context.skill.optional_parameter));
        }

        debug("all_param_keys are following.");
        debug(all_param_keys);

        let parameters_parsed = [];
        for (let param_key of all_param_keys){
            if (param_key === this.context.confirming){
                continue;
            }
            debug(`Check if "${payload}" is suitable for ${param_key}.`);
            parameters_parsed.push(
                this._parse_parameter(this.bot.check_parameter_type(param_key), param_key, payload, true).then(
                    (response) => {
                        debug(`Value fits to ${param_key}.`);
                        return {
                            is_fit: true,
                            key: param_key,
                            value: response
                        }
                    }
                ).catch(
                    (error) => {
                        debug(`Value does not fit to ${param_key}`);
                        return {
                            is_fit: false,
                            key: param_key,
                            value: payload
                        }
                    }
                )
            );
        }

        return Promise.all(parameters_parsed).then(
            (responses) => {
                let fit_parameters = [];
                for (let response of responses){
                    if (response.is_fit === true){
                        fit_parameters.push(response);
                    }
                }
                debug(`There are ${fit_parameters.length} applicable parameters.`);

                if (fit_parameters.length === 0){
                    // This is no idea
                    debug("We conclude this is no idea.");
                    return {
                        result: "no_idea",
                        intent: intent
                    }
                } else if (fit_parameters.length === 1){
                    // This is change parameter.
                    debug("We conclude this is change parameter.");
                    return {
                        result: "change_parameter",
                        payload: payload,
                        parameter: {
                            key: fit_parameters[0].key,
                            value: fit_parameters[0].value
                        }
                    }
                } else {
                    debug("Since we found multiple applicable parameters, we need to ask for user what parameter the user likes to change.");

                    // TENTATIVE BEGIN //
                    return {
                        result: "change_parameter",
                        payload: payload,
                        parameter: {
                            key: fit_parameters[0].key,
                            value: fit_parameters[0].value
                        }
                    }
                    // TENTATIVE END //
                }
            }
        );
    }

    async modify_previous_parameter(){
        if (this.context.previous && this.context.previous.confirmed && this.context.previous.confirmed.length > 0){
            if (this.bot.check_parameter_type(this.context.previous.confirmed[0]) != "not_applicable") {
                this.bot.collect(this.context.previous.confirmed[0]);

                // We remove this parameter from history.
                debug(`Removing ${this.context.previous.confirmed[0]} from previous.confirmed.`);
                this.context.previous.confirmed.shift();
            }
        }
    }

    async dig(intent){
        this.context.parent = {
            intent: this.context.intent,
            skill: {
                name: this.context.skill.name
            },
            to_confirm: this.context.to_confirm,
            confirming: this.context.confirming,
            confirmed: this.context.confirmed,
            previous: this.context.previous,
            param_change_history: this.context.param_change_history,
            sender_language: this.context.sender_language,
            translation: this.context.translation
        }
        return this.change_intent(intent);
    }

    async restart_conversation(intent){
        this.context.intent = intent;
        this.context.to_confirm = [];
        this.context.confirming = null;
        this.context.confirmed = {};
        this.context.previous = {
            confirmed: [],
            message: []
        }
        this.context._message_queue = [];

        // Re-instantiate skill since some params might been added dynamically.
        if (this.context.intent && this.context.intent.name){
            let skill = this.instantiate_skill(this.context.intent.name);

            if (!skill){
                debug(`While it seems user tries to restart conversation, we ignore it since we have no corresponding skill.`);
                return;
            }

            this.context.skill = skill;
        }

        // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
        // After that, we depend on context.to_confirm to identify to_confirm parameters.
        if (this.context.to_confirm.length == 0){
            this.context.to_confirm = this.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
        }
        debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);

        // Log skill status.
        log.skill_status(this.bot.extract_sender_id(), this.context.skill.type, "launched");

        await this.begin();

        // If we found pause, exit, or init flag, we skip remaining process.
        if (this.context._pause || this.context._exit || this.context._init){
            debug(`Detected pause or exit or init flag so we skip processing parameters.`);
            return;
        }

        // If we find some parameters from initial message, add them to the conversation.
        let parameters_processed = [];
        if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
            for (let param_key of Object.keys(this.context.intent.parameters)){
                // Parse and Add parameters using skill specific logic.
                parameters_processed.push(
                    this.apply_parameter(param_key, this.context.intent.parameters[param_key]).then(
                        (applied_parameter) => {
                            if (applied_parameter == null){
                                debug("Parameter was not applicable. We skip reaction and go to finish.");
                                return;
                            }
                            return this.react(null, applied_parameter.key, applied_parameter.value);
                        }
                    ).catch(
                        (error) => {
                            debug("Parser rejected the value.");
                            return this.react(error, param_key, this.context.intent.parameters[param_key]);
                        }
                    )
                );
            }
        }
        return Promise.all(parameters_processed);
    }

    async change_intent(intent){
        this.context.intent = intent;
        this.context.to_confirm = [];
        this.context.confirming = null;

        // Re-instantiate skill since some params might been added dynamically.
        if (this.context.intent && this.context.intent.name){
            let skill = this.instantiate_skill(this.context.intent.name);

            if (!skill){
                debug(`While it seems user tries to change intent, we ignore it since we have no corresponding skill.`);
                return;
            }

            this.context.skill = skill;
        }

        // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
        // After that, we depend on context.to_confirm to identify to_confirm parameters.
        if (this.context.to_confirm.length == 0){
            this.context.to_confirm = this.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
        }
        debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);

        // Log skill status.
        log.skill_status(this.bot.extract_sender_id(), this.context.skill.type, "launched");

        await this.begin();

        // If we found pause or exit flag, we skip remaining process.
        if (this.context._pause || this.context._exit || this.context._init){
            debug(`Detected pause or exit or init flag so we skip processing parameters.`);
            return;
        }

        // If we find some parameters from initial message, add them to the conversation.
        let all_parameters_processed = [];
        if (this.context.intent.parameters && Object.keys(this.context.intent.parameters).length > 0){
            for (let param_key of Object.keys(this.context.intent.parameters)){
                // Parse and Add parameters using skill specific logic.
                all_parameters_processed.push(
                    this.apply_parameter(param_key, this.context.intent.parameters[param_key]).then(
                        (applied_parameter) => {
                            if (applied_parameter == null){
                                debug("Parameter was not applicable. We skip reaction and go to finish.");
                                return;
                            }
                            return this.react(null, applied_parameter.key, applied_parameter.value);
                        }
                    ).catch(
                        (error) => {
                            debug("Parser rejected the value.");
                            return this.react(error, param_key, this.context.intent.parameters[param_key]);
                        }
                    )
                );
            }
        }

        return Promise.all(all_parameters_processed);
    }

    async begin(){
        if (!this.context.skill.begin){
            debug(`Beginning action not found. Skipping.`)
            return;
        }

        debug("Going to perform beginning action.");
        await this.context.skill.begin(this.bot, this.event, this.context);
    }

    /**
     * @method
     * @return {context}
     */
    async finish(){
        // If pause flag has been set, we stop processing remaining actions while keeping context.
        if (this.context._pause){
            debug("Detected pause flag. We stop processing finish().");
            this.context._pause = false;
            return this.context;
        }

        // If exit flag has been set, we stop processing remaining actions while keeping context except for confirming.
        if (this.context._exit){
            debug("Detected exit flag. We stop processing finish().");
            this.context.confirming = null;
            this.context._exit = false;
            return this.context;
        }

        // If exit flag has been set, we stop processing remaining actions and clear context completely.
        if (this.context._init){
            debug("Detected init flag. We stop processing finish().");
            this.context = null;
            return this.context;
        }

        // If we still have parameters to confirm, we collect them.
        if (this.context.to_confirm.length > 0){
            debug("Going to collect parameter.");
            await this._collect();
            return this.context;
        }

        // If we have no parameters to confirm, we finish this conversation using finish method of skill.
        debug("Going to perform final action.");

        // Execute finish method in skill.
        await this.context.skill.finish(this.bot, this.event, this.context);

        // Double check if we have no parameters to confirm since developers can execute collect() method inside finsh().
        if (this.context.to_confirm.length > 0){
            debug("Going to collect parameter.");
            await this._collect();
            return this.context;
        }

        // Log skill status.
        log.skill_status(this.bot.extract_sender_id(), this.context.skill.type, "completed");

        if (this.context.parent){
            // This is sub skill so we get parent context back.
            debug(`We finished sub skill and get back to parent skill "${this.context.parent.intent.name}".`);
            this.context.parent.previous.message = this.context.previous.message.concat(this.context.parent.previous.message);
            this.context = this.context.parent;
            delete this.context.parent;
        } else if (this.context.skill.clear_context_on_finish){
            // This is Root skill. If clear_context_on_finish flag is true, we clear context.
            debug(`Clearing context.`);
            this.context = null;
        } else {
            // This is Root skill. And we need to keep context. But we should still discard param change history.
            this.context.param_change_history = [];
        }

        return this.context;
    }
};
