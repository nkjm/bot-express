'use strict';

let Promise = require('bluebird');
let debug = require("debug")("bot-express:flow");
let BotExpressParseError = require("../error/parse");
let Bot = require("../bot"); // Libraries to be exposed to skill.
let Nlp = require("../nlp");

module.exports = class Flow {
    constructor(messenger, event, context, options){
        this.messenger = messenger;
        this.bot = new Bot(messenger);
        this.event = event;
        this.options = options;
        this.context = context;

        if (this.context.intent && this.context.intent.name){
            if (!this.context.skill){
                this.context.skill = this.instantiate_skill(this.context.intent.name);
                debug(this.context.skill);
            }

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
        // If the intent is not identified, we use default_skill.
        if (intent == this.options.default_intent){
            skill = this.options.default_skill;
        } else {
            skill = intent;
        }

        let skill_instance;

        if (skill == "builtin_default"){
            debug("Use built-in default skill.");
            let skill_class = require("../skill/default");
            skill_instance = new skill_class(this.bot, this.event);
        } else {
            debug(`Look for ${skill} skill.`);
            let skill_class;
            try {
                skill_class = require(`${this.options.skill_path}${skill}`);
                debug("Skill found.")
            } catch(exception){
                debug("Skill not found.");
                throw(exception);
            }
            skill_instance = new skill_class(this.bot, this.event);
        }

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
    Check if the intent is related to the parameter.
    @param {String} param - Name of the parameter.
    @param {String} intent - Name of the intent.
    @returns {Boolean} Returns true if it is related. Otherwise, false.
    */
    is_intent_related_to_param(param, intent){
        return false;
    }

    _collect(){
        if (this.context.to_confirm.length == 0){
            debug("While collect() is called, there is no parameter to confirm.");
            return Promise.reject();
        }
        let message;
        let param_key = this.context.to_confirm[0];
        let param_type = this._check_parameter_type(param_key);

        if (!!this.context.skill[param_type][param_key].message_to_confirm[this.messenger.type]){
            // Found message platform specific message object.
            debug("Found message platform specific message object.");
            message = this.context.skill[param_type][param_key].message_to_confirm[this.messenger.type];
        } else if (!!this.context.skill[param_type][param_key].message_to_confirm){
            // Found common message object. We compile this message object to get message platform specific message object.
            debug("Found common message object.");
            message = this.context.skill[param_type][param_key].message_to_confirm;
        } else {
            debug("While we need to send a message to confirm parameter, the message not found.");
            return Promise.reject();
        }

        // Set confirming.
        this.context.confirming = param_key;

        // Send question to the user.
        return this.messenger.reply([message]);
    }

    change_parameter(key, value){
        return this.apply_parameter(key, value, true);
    }

    apply_parameter(key, value, is_change = false){
        debug(`Applying parameter.`);

        let parameter_type = this._check_parameter_type(key);
        if (parameter_type == "not_applicable"){
            debug("This is not the parameter we should care about. We just skip this.");
            return Promise.resolve();
        }
        debug(`Parameter type is ${parameter_type}`);

        return this._parse_parameter(parameter_type, key, value).then(
            (parsed_value) => {
                debug(`Parsed value is ${parsed_value}`);
                this._add_parameter(key, parsed_value, is_change);
                debug(`apply_parameter succeeded. We have now ${this.context.to_confirm.length} parameters to confirm.`);
                return {
                    key: key,
                    value: parsed_value
                }
            }
        );
    }

    /**
    Check parameter type.
    @private
    @param {String} key - Parameter name.
    @returns {String} "required_parameter" | "optional_parameter" | "dynamic_parameter" | "not_applicable"
    */
    _check_parameter_type(key){
        if (!!this.context.skill.required_parameter && !!this.context.skill.required_parameter[key]){
            return "required_parameter";
        } else if (!!this.context.skill.optional_parameter && !!this.context.skill.optional_parameter[key]){
            return "optional_parameter";
        } else if (!!this.context.skill.dynamic_parameter && !!this.context.skill.dynamic_parameter[key]){
            return "dynamic_parameter";
        }
        return "not_applicable";
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
    _parse_parameter(type, key, value, strict = false){
        return new Promise((resolve, reject) => {
            debug(`Parsing parameter {${key}: "${value}"}`);

            // We define new reject just for parse.
            let parse_reject = (e) => {
                let message;
                if (e instanceof Error){
                    message = e.message;
                } else {
                    message = e;
                }
                return reject(new BotExpressParseError(message));
            }

            if (!!this.context.skill[type][key].parser){
                debug("Parse method found in parameter definition.");
                return this.context.skill[type][key].parser(value, this.bot, this.event, this.context, resolve, parse_reject);
            } else if (!!this.context.skill["parse_" + key]){
                debug("Parse method found in default parser function name.");
                return this.context.skill["parse_" + key](value, this.bot, this.event, this.context, resolve, parse_reject);
            } else {
                if (strict){
                    return parse_reject("PARSER NOT FOUND");
                }
                debug("Parse method NOT found. We use the value as it is as long as the value is set.");
                if (value === null || value === ""){
                    return parse_reject("Value not set");
                } else {
                    return resolve(value);
                }
            }
        });
    }

    _add_parameter(key, value, is_change = false){
        debug(`Adding parameter {${key}: "${value}"}`);

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

    react(error, key, value){
        return new Promise((resolve, reject) => {
            let param_type = this._check_parameter_type(key);

            if (this.context.skill[param_type] && this.context.skill[param_type][key]){
                if (this.context.skill[param_type][key].reaction){
                    debug(`Reaction for ${key} found. Performing reaction...`);
                    return this.context.skill[param_type][key].reaction(error, value, this.bot, this.event, this.context, resolve, reject);
                } else if (this.context.skill["reaction_" + key]){
                    debug(`Reaction for ${key} found. Performing reaction...`);
                    return this.context.skill["reaction_" + key](error, value, this.bot, this.event, this.context, resolve, reject);
                } else {
                    // This parameter does not have reaction so do nothing.
                    debug(`Reaction for ${key} not found.`);
                    return resolve();
                }
            } else {
                debug(`There is no parameter we should care about. So skip reaction.`);
                return resolve(`There is no parameter we should care about. So skip reaction.`);
            }
        });
    }

    /**
    Identify what the user like to achieve.
    @param {String|MessageObject} payload - Data from which we try to identify what the user like to achieve.
    @returns {Object} response
    @returns {String} response.result - "dig", "restart_conversation", "change_intent", "change_parameter" or "no_idea"
    @returns {Object} response.intent - Intent object.
    @returns {Object} response.parameter - Parameter.
    @returns {String} response.parameter.key - Parameter name.
    @returns {String|Object} response.parameter.value - Parameter value.
    */
    what_you_want(payload){
        let intent_identified;
        if (typeof payload !== "string"){
            debug("The payload is not string so we skip identifying intent.");
            let intent = {
                name: this.options.default_intent
            }
            intent_identified = Promise.resolve(intent);
        } else {
            debug("Going to check if we can identify the intent.");
            let nlp = new Nlp(this.options.nlp, this.options.nlp_options);
            intent_identified = nlp.identify_intent(payload, {
                session_id: this.messenger.extract_sender_id()
            });
        }

        return intent_identified.then(
            (intent) => {
                if (intent.name != this.options.default_intent){
                    // This is dig or change intent or restart conversation.

                    // Check if this is dig.
                    if (this.context._flow == "reply" && this.context.confirming){
                        let param_type = this._check_parameter_type(this.context.confirming);

                        // Check if sub skill is configured in the confirming parameter.
                        if (this.context.skill[param_type][this.context.confirming].sub_skill &&
                            this.context.skill[param_type][this.context.confirming].sub_skill.indexOf(intent.name) !== -1){
                            // This is dig.
                            debug("We conclude this is dig.");
                            return {
                                result: "dig",
                                intent: intent
                            }
                        }
                    }

                    // Check if this is restart conversation.
                    debug("This is dig, change intent or restart conversation.");
                    if (intent.name == this.context.intent.name){
                        // This is restart conversation.
                        debug("We conclude this is restart conversation.");
                        return {
                            result: "restart_conversation",
                            intent: intent
                        }
                    }

                    // This is change intent.
                    debug("We conclude this is change intent.");
                    return {
                        result: "change_intent",
                        intent: intent
                    }
                }

                // This can be change parameter or no idea.
                debug("We could not identify intent so this can be change parameter or no idea.");
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
                    debug(`Check if "${payload}" is suitable for ${param_key}.`);
                    parameters_parsed.push(
                        this._parse_parameter(this._check_parameter_type(param_key), param_key, payload, true).then(
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
                                if (error.name == "BotExpressParseError"){
                                    debug(`Value does not fit to ${param_key}`);
                                    return {
                                        is_fit: false,
                                        key: param_key,
                                        value: payload
                                    }
                                } else {
                                    return Promise.reject(error);
                                }
                            }
                        )
                    );
                }

                return Promise.all(parameters_parsed).then(
                    (responses) => {
                        let fit_parameters = [];
                        debug(responses);
                        for (let response of responses){
                            if (response.is_fit === true){
                                fit_parameters.push(response);
                            }
                        }
                        debug(fit_parameters);
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
        );
    }

    dig(intent){
        this.context.parent = {
            intent: this.context.intent,
            to_confirm: this.context.to_confirm,
            confirming: this.context.confirming,
            confirmed: this.context.confirmed,
            previous: this.context.previous,
            skill: this.context.skill,
            sender_language: this.context.sender_language
        }
        return this.restart_conversation(intent);
    }

    restart_conversation(intent){
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
            this.context.skill = this.instantiate_skill(this.context.intent.name);
        }

        // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
        // After that, we depend on context.to_confirm to identify to_confirm parameters.
        if (this.context.to_confirm.length == 0){
            this.context.to_confirm = this.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
        }
        debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);

        return this.begin().then(
            (response) => {
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
                                    if (error.name == "BotExpressParseError"){
                                        debug("Parser rejected the value.");
                                        return this.react(error, param_key, this.context.intent.parameters[param_key]);
                                    } else {
                                        return Promise.reject(error);
                                    }
                                }
                            )
                        );
                    }
                }
                return Promise.all(parameters_processed);
            }
        );
    }

    change_intent(intent){
        this.context.to_confirm = [];
        this.context.confirming = null;
        this.context.intent = intent;

        // Re-instantiate skill since some params might been added dynamically.
        if (this.context.intent && this.context.intent.name){
            this.context.skill = this.instantiate_skill(this.context.intent.name);
        }

        // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
        // After that, we depend on context.to_confirm to identify to_confirm parameters.
        if (this.context.to_confirm.length == 0){
            this.context.to_confirm = this.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
        }
        debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);

        return this.begin().then(
            (response) => {
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
                                    if (error.name == "BotExpressParseError"){
                                        debug("Parser rejected the value.");
                                        return this.react(error, param_key, this.context.intent.parameters[param_key]);
                                    } else {
                                        return Promise.reject(error);
                                    }
                                }
                            )
                        );
                    }
                }
                return Promise.all(all_parameters_processed);
            }
        );
    }

    begin(){
        if (!this.context.skill.begin){
            debug(`Beginning action not found. Skipping.`)
            return Promise.resolve();
        }

        debug("Going to perform beginning action.");
        let begun = new Promise((resolve, reject) => {
            this.context.skill.begin(this.bot, this.event, this.context, resolve, reject);
        });

        return begun;
    }

    finish(){
        this.context.previous.message.unshift({
            from: "user",
            message: this.messenger.extract_message()
        });

        // If pause flat has been set, we stop processing following actions and exit.
        if (this.context._pause){
            debug("Dected pause flag. We stop processing collect() and finish().");
            this.context._pause = false;
            return Promise.resolve(this.context);
        }

        // If we still have parameters to confirm, we collect them.
        if (this.context.to_confirm.length > 0){
            debug("Going to collect parameter.");
            return this._collect().then(
                (response) => {
                    return this.context;
                }
            );
        }

        // If we have no parameters to confirm, we finish this conversation using finish method of skill.
        debug("Going to perform final action.");
        let finished = new Promise((resolve, reject) => {
            this.context.skill.finish(this.bot, this.event, this.context, resolve, reject);
        });

        return finished.then(
            (response) => {
                debug("Final action succeeded.");
                // Double check if we have no parameters to confirm since developers can execute collect() method inside finsh().
                if (this.context.to_confirm.length > 0){
                    debug("Going to collect parameter.");
                    return this._collect();
                }

                debug("Final action done. Wrapping up.");

                // If this is sub skill, we get parent context back.
                if (this.context.parent){
                    debug(`We finished sub skill and get back to parent skill "${this.context.parent.intent.name}".`);
                    this.context.parent.previous.message = this.context.previous.message.concat(this.context.parent.previous.message);
                    this.context = this.context.parent;
                    return response;
                }

                // This is Root Skill. We clear context depeding on the configuration and return.
                if (this.context.skill.clear_context_on_finish && this.context.to_confirm.length == 0){
                    debug(`Clearing context.`);
                    this.context = null;
                }
                return response;
            }
        ).then(
            (response) => {
                return this.context;
            }
        );
    }
};
