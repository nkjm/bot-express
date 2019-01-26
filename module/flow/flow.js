"use strict";

const debug = require("debug")("bot-express:flow");
const log = require("../logger");
const Bot = require("../bot"); // Libraries to be exposed to skill.
const Nlu = require("../nlu");
const Translator = require("../translator");

module.exports = class Flow {
    constructor(options, messenger, event, context){
        this.options = options;
        this.messenger = messenger;
        this.event = event;
        this.context = context;

        this.bot = new Bot(this.options, this.event, this.context, this.messenger);
        if (this.options.translator){
            this.translator = new Translator(this.options.translator);
            this.bot.translator = this.translator;
        }

        if (this.context.intent && this.context.intent.name){
            debug(`Init and reviving skill instance.`);
            this.context.skill = this.revive_skill(this.instantiate_skill(this.context.intent));

            // At the beginning of the conversation, we identify to_confirm parameters by required_parameter in skill and context.to_confirm.
            // While context.to_confirm should be empty in start conversation flow, there is a chance that it already has some values in btw flow so we need to check both skill and context.
            // Other than that, we use context.to_confirm as it is.
            if (this.context.to_confirm.length == 0){
                this.context.to_confirm = this.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
            }
            debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);
        }
    }

    /**
     * Instantiate skill.
     * @param {intent} intent - Intent object.
     * @return {Object} Skill instance.
     */
    instantiate_skill(intent){
        if (!(intent && intent.name)){
            debug("intent.name should have been set but not.");
            return;
        }

        let skill_name;

        // If the intent is not identified, we use skill.default.
        if (intent.name == this.options.default_intent){
            skill_name = this.options.skill.default;
        } else {
            skill_name = intent.name;
        }

        let skill;

        if (skill_name == "builtin_default"){
            debug("Use built-in default skill.");
            let Skill = require("../skill/default");
            skill = new Skill(intent.config);
        } else {
            debug(`Look for ${skill_name} skill.`);
            try {
                require.resolve(`${this.options.skill_path}${skill_name}`);
            } catch (e){
                debug(`Skill: "${skill_name}" not found.`)
                return;
            }

            debug(`Found skill: "${skill_name}".`);
            let Skill = require(`${this.options.skill_path}${skill_name}`);
            skill = new Skill(intent.config);
        }

        skill.type = skill_name;

        return skill;
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
            }
        }
        return to_confirm;
    }


    /**
     * Function to revive skill instance from change log.
     * @param {Object} - Skill instance.
     * @return {Object} - Revived skill instance.
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
                        log.param.message_to_confirm = Function.call(skill, "return " + log.param.message_to_confirm)();
                    } catch (error) {
                        debug(`message_to_confirm looks like just a string so we use it as it is.`);
                    }
                }
            }
            if (log.param.condition){
                if (typeof log.param.condition === "string"){
                    debug(`condition is string. We try to make it function...`);
                    try {
                        log.param.condition = Function.call(skill, "return " + log.param.condition)();
                    } catch (error) {
                        debug(`condition looks like just a string so we use it as it is.`);
                    }
                }
            }
            if (log.param.parser){
                if (typeof log.param.parser === "string"){
                    debug(`parser is string. We try to make it function...`);
                    try {
                        log.param.parser = Function.call(skill, "return " + log.param.parser)();
                    } catch (error) {
                        debug(`parser looks like built-in parser so we use it as it is.`);
                    }
                }
            }
            if (log.param.reaction){
                log.param.reaction = Function.call(skill, "return " + log.param.reaction)();
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
     * Process parameters with multiple input parameters.
     * @method
     * @async
     * @param {Object} parameters
     */
    async process_parameters(parameters){
        debug("Processing parameters..");

        if (!(parameters && Object.keys(parameters).length)){
            debug("There is no parameters in input parameters. Exit process parameters.");
            return;
        }

        if (!this.context.heard){
            this.context.heard = {};
        }

        const param_key = await this._pop_parameter_key_to_collect();

        if (!param_key){
            debug("There is no parameters to confirm for now but we save the input parameters as heard just in case. Exit process parameters.");
            Object.assign(this.context.heard, parameters);
            return;
        }

        if (typeof parameters[param_key] === "undefined"){
            debug(`Input parameters does not contain "${param_key}" which we should process now. We save the rest of input parameters as heard in context and exit process parameters.`);
            Object.assign(this.context.heard, parameters);
            return;
        }

        // Parse and add parameter.
        const applied_parameter = await this.apply_parameter(param_key, parameters[param_key]);

        // Take reaction.
        await this.bot.react(applied_parameter.error, applied_parameter.param_key, applied_parameter.param_value);

        // Delete processed parameter.
        const updated_parameters = JSON.parse(JSON.stringify(parameters));
        delete updated_parameters[applied_parameter.param_key];

        debug("Updated input parameters follow.");
        debug(updated_parameters);
        
        await this.process_parameters(updated_parameters);
    }

    async change_parameter(param_key, param_value){
        return this.apply_parameter(param_key, param_value, true);
    }

    /**
     * Parse and add parameter to context.
     * @method
     * @async
     * @param {String} param_key
     * @param {*} param_value
     * @param {Boolean} is_change
     * @return {Object}
     */
    async apply_parameter(param_key, param_value, is_change = false){
        debug(`Applying parameter.`);

        if (this.bot.check_parameter_type(param_key) === "not_applicable"){
            debug("This is not the parameter we should care about. Skipping.");
            return;
        }

        // Parse parameter.
        let parse_error;
        try {
            param_value = await this.bot.parse_parameter(param_key, param_value);
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

        if (parse_error === undefined){
            debug(`Parser accepted the value. Parsed value for parameter: "${param_key}" follows.`);
            debug(param_value);
    
            // Add parameter to context.
            this.bot.add_parameter(param_key, param_value, is_change);
        }

        return {
            error: parse_error,
            param_key: param_key,
            param_value: param_value
        }
    }

    /**
     * Identify what the user has in mind.
     * @method
     * @async
     * @param {String|MessageObject} payload - Data from which we try to identify what the user like to achieve.
     * @returns {Object} response
     * @returns {String} response.result - "dig", "restart_conversation", "change_intent", "change_parameter" or "no_idea"
     * @returns {Object} response.intent - Intent object.
     * @returns {String|MessageObject} payload - Passed payload.
     * @returns {Object} response.parameter - Parameter.
     * @returns {String} response.parameter.key - Parameter name.
     * @returns {String|Object} response.parameter.value - Parameter value.
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

                    if (parsed_data.intent.name === this.options.modify_previous_parameter_intent){
                        debug(`This is modify previous parameter.`);
                        return {
                            result: "modify_previous_parameter",
                            intent: parsed_data.intent,
                            payload: payload
                        }
                    } else if (parsed_data.intent.name === this.context.intent.name){
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
                const param_type = this.bot.check_parameter_type(this.context.confirming);

                let param;
                if (this.context.confirming_property){
                    param = this.context.skill[this.context.confirming_property.parameter_type][this.context.confirming_property.parameter_key].property[this.context.confirming];
                } else {
                    param = this.context.skill[param_type][this.context.confirming];
                }

                // Check if sub skill is configured in the confirming parameter.
                if (param.sub_skill && param.sub_skill.indexOf(intent.name) !== -1){
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
                this.bot.parse_parameter(param_key, payload, true).then(
                    (response) => {
                        debug(`Value fits to ${param_key}.`);
                        return {
                            is_fit: true,
                            key: param_key,
                            value: response
                        }
                    }
                ).catch(
                    (e) => {
                        if (e.name === "Error"){
                            debug(`Value does not fit to ${param_key}`);
                            return {
                                is_fit: false,
                                key: param_key,
                                value: payload
                            }
                        } else {
                            throw e;
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

    /**
     * Modify previous parameter by changing context status.
     * @method
     */
    modify_previous_parameter(){
        // Check if there is previously processed parameter.
        if (!(this.context.previous && this.context.previous.processed && this.context.previous.processed.length > 0)){
            debug(`There is no processed parameter.`);
            return;
        }

        const param_key = this.context.previous.processed[0]

        // Check if there is corresponding parameter in skill just in case.
        if (this.bot.check_parameter_type(param_key) == "not_applicable") {
            debug(`"${param_key}" not found in skill.`);
            return;
        }

        // Put previous parameter to to confirm queue. But this parameter may not be previously confirmed since condition might return false.
        this.bot.collect(param_key);

        // We remove this parameter from processed history.
        debug(`Removing ${param_key} from previous.processed.`);
        this.context.previous.processed.shift();

        // We remove this parameter from confirmed history.
        if (this.context.previous && this.context.previous.confirmed && this.context.previous.confirmed.length > 0 && this.context.previous.confirmed[0] == param_key){
            debug(`Removing ${param_key} from previous.confirmed.`);
            this.context.previous.confirmed.shift();
        }

        // If this previous parameter has not been confirmed, we rewrind one more processed parameter.
        if (this.context.confirming_property){
            if (this.context.confirming_property.confirmed[param_key] === undefined){
                debug(`We rewrind one more processed parameter since previously processed parameter has not been confirmed.`);
                return this.modify_previous_parameter();
            }
        } else {
            if (this.context.confirmed[param_key] === undefined){
                debug(`We rewrind one more processed parameter since previously processed parameter has not been confirmed.`)
                return this.modify_previous_parameter();
            }
        }
    }

    /**
     * @method
     * @async
     * @param {Object} intent 
     */
    async dig(intent){
        if (!Array.isArray(this.context._parent)){
            this.context._parent = [];
        }
        this.context._parent.push({
            intent: this.context.intent,
            skill: {
                name: this.context.skill.name
            },
            to_confirm: this.context.to_confirm,
            confirming: this.context.confirming,
            confirming_property: this.context.confirming_property,
            confirmed: this.context.confirmed,
            heard: this.context.heard,
            previous: this.context.previous,
            param_change_history: this.context.param_change_history,
            sender_language: this.context.sender_language,
            translation: this.context.translation
        })
        this.context._digging = true;
        return this.change_intent(intent);
    }

    /**
     * @method
     * @async
     * @param {Object} intent
     */
    async restart_conversation(intent){
        this.context.intent = intent;
        this.context.to_confirm = [];
        this.context.confirming = null;
        this.context.confirming_property = null;
        this.context.confirmed = {};
        this.context.heard = {};
        this.context.previous = {
            event: null,
            confirmed: [],
            processed: [],
            message: []
        }
        this.context._message_queue = [];

        // Re-instantiate skill since some params might been added dynamically.
        if (this.context.intent && this.context.intent.name){
            let skill = this.instantiate_skill(this.context.intent);

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
        await this.process_parameters(this.context.intent.parameters);
    }

    /**
     * @method
     * @async
     * @param {Object} intent 
     */
    async change_intent(intent){
        // We keep some inforamtion like context.confirmed, context.heard and context.previous.
        this.context.intent = intent;
        this.context.to_confirm = [];
        this.context.confirming = null;
        this.context.confirming_property = null;
        this.context.previous =  {
            event: null,
            confirmed: [],
            processed: [],
            message: []
        }
        this.context._message_queue = [];

        // Re-instantiate skill since some params might been added dynamically.
        if (this.context.intent && this.context.intent.name){
            let skill = this.instantiate_skill(this.context.intent);

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
        await this.process_parameters(this.context.intent.parameters);
    }

    /**
     * Run begin method in skill.
     * @method
     * @async
     */
    async begin(){
        if (!this.context.skill.begin){
            debug(`Beginning action not found. Skipping.`)
            return;
        }

        debug("Going to perform beginning action.");
        await this.context.skill.begin(this.bot, this.event, this.context);
    }

    /**
     * Retrieve parameter to collect next by checking condition.
     * @method
     * @async
     * @return {String} Parameter key. If there is no parameter to collect, returns null.
     */
    async _pop_parameter_key_to_collect(){
        // Check if there is parameter to confirm.
        if (this.context.to_confirm.length == 0){
            debug("There is no parameter to confirm anymore.");
            return;
        }

        const param_key = this.context.to_confirm[0];
        const param_type = this.bot.check_parameter_type(param_key);

        if (!this.context.skill[param_type]){
            throw new Error(`${param_type} parameter not found in skill.`);
        }

        let param;
        if (this.context.confirming_property && param_key !== this.context.confirming_property.parameter_key){
            if (!(
                    this.context.skill[this.context.confirming_property.parameter_type][this.context.confirming_property.parameter_key] && 
                    this.context.skill[this.context.confirming_property.parameter_type][this.context.confirming_property.parameter_key].property && 
                    this.context.skill[this.context.confirming_property.parameter_type][this.context.confirming_property.parameter_key].property[param_key])){
                throw new Error(`Property: "${param_key}" not found in parameter "${this.context.confirming_property.parameter_key}".`);
            }
            param = this.context.skill[this.context.confirming_property.parameter_type][this.context.confirming_property.parameter_key].property[param_key];
        } else {
            if (!this.context.skill[param_type][param_key]){
                throw new Error(`Parameter: "${param_key}" not found in skill.`);
            }
            param = this.context.skill[param_type][param_key]
        }

        // If condition is not defined, we use this parameter.
        if (typeof param.condition === "undefined"){
            return param_key;
        }

        // Since condition is defined, we check if we should use this parameter.
        const condition = param.condition;

        // Check if condition is properly implemented.
        if (typeof condition != "function"){
            throw new Error("Condition should be function.");
        }

        // If condition returns true, we use this parameter.
        if (await condition(this.bot, this.event, this.context)){
            return param_key;
        }

        // Since condition returns false, we should skip this parameter and check next parameter.
        debug(`We skip collecting "${param_key}" due to condition.`);
        this.context.previous.processed.unshift(param_key);
        this.context.to_confirm.shift();

        return await this._pop_parameter_key_to_collect();
    }

    /**
     * Send/reply to user to ask to_confirm parameter.
     * @method
     * @async
     */
    async _collect(){
        // Check condition. If condition is undefined or returns true, we collect this parameter.
        // If condition returns false, we skip this parameter.
        const param_key = await this._pop_parameter_key_to_collect();
        // If there is no parameter to collect, we just return.
        if (!param_key){
            return;
        }

        // Set param to be used in this method since there is a chance that either parameter.key or property.key would be the param.
        const param_type = this.bot.check_parameter_type(param_key);
        let param;
        if (this.context.confirming_property){
            param = this.context.skill[this.context.confirming_property.parameter_type][this.context.confirming_property.parameter_key].property[param_key];
        } else {
            param = this.context.skill[param_type][param_key];
        }

        // Check if this parameter has property.
        // If has, we collect them.
        if (param.property){
            // parameter_key will be used in finish() to identify which parameter we should save properties to.
            // to_confrim will be used in finish() to identify which confirmed parameter we should aggregate.
            // confirmed will be used to apply to parent parameter when all properties set.
            this.context.confirming_property = {
                parameter_key: param_key,
                parameter_type: param_type,
                to_confirm: Object.keys(param.property).reverse(),
                confirmed: {}
            }

            // Set context.to_confirm based on property.
            for (let prop_key of this.context.confirming_property.to_confirm){
                this.context.to_confirm.unshift(prop_key);
            }

            return await this._collect();
        }

        // Set context.confirming.
        this.context.confirming = param_key;

        // Check if there is message_to_confirm.
        if (!param.message_to_confirm){
            throw new Error("While we need to send a message to confirm parameter, the message not found.");
        }

        // Setting message_to_confirm.
        // If there is messenger specific message object under message_to_confirm, we use it.
        // If there is not, we use message_to_confirm.
        let message_to_confirm;
        if (param.message_to_confirm[this.bot.type]){
            // Found message platform specific message object.
            debug("Found messenger specific message object.");
            message_to_confirm = param.message_to_confirm[this.bot.type];
        } else if (param.message_to_confirm){
            // We compile this message object to get message platform specific message object.
            message_to_confirm = param.message_to_confirm;
        }

        // Setting message by compiling message_to_confirm.
        // If message_to_confirm is function, we execute it and use the response.
        // If message_to_confirm is object, we use it.
        let message;
        if (typeof message_to_confirm === "function"){
            debug("message_to_confirm is made of function. We generate message with it.");
            message = await message_to_confirm(this.bot, this.event, this.context);
        } else if (typeof message_to_confirm === "object" || typeof message_to_confirm === "string"){
            debug("message_to_confirm is made of object|string. We use it as it is.");
            message = message_to_confirm;
        } else {
            throw new Error("Format of message_to_confirm is invalid.");
        }

        // Make sure that message is array.
        if (!Array.isArray(message)){
            // The message is single object so we make it array.
            message = [message];
        }

        // Send message to user by using reply or push depending on flow type.
        if (this.context._flow == "push"){
            debug("We use send method to collect parameter since this is push flow.");
            debug("Reciever userId is " + this.event.to[`${this.event.to.type}Id`]);
            await this.bot.send(this.event.to[`${this.event.to.type}Id`], message, this.context.sender_language);
        } else {
            debug("We use reply method to collect parameter.");
            await this.bot.reply_to_collect(message);
        }
    }

    /**
     * @method
     * @async
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

        // If we're now confiming property, check if we got all the required properties.
        if (this.context.to_confirm.length && this.context.confirming_property){
            // While _pop_parameter_key_to_collect() will be executed in _collect() again, it ends up with same result so should be harmless.
            const param_key = await this._pop_parameter_key_to_collect();

            // If param key is equal to confirming property's parameter, it means we collected all required properties so we're now ready to copy confirmed properties to context.confirmed.
            if (param_key === this.context.confirming_property.parameter_key){
                debug(`It seems we have all the required property so set it to parameter.`);
                
                // Copy confirmed property temporarily.
                let confirmed_property = JSON.parse(JSON.stringify(this.context.confirming_property.confirmed));

                // Clear confirming property object.
                delete this.context.confirming_property;

                // Apply aggregated property to parameter.
                await this.bot.apply_parameter(param_key, confirmed_property);

                return await this.finish();
            }
        }

        // Check if there is corresponding parameter in context.heard.
        if (this.context.to_confirm.length && this.context.heard[this.context.to_confirm[0]]){
            debug("Found corresponding parameter in context.heard. We try to apply.");
            await this.process_parameters(this.context.heard);
        }

        // If we still have parameters to confirm, we collect them.
        if (this.context.to_confirm.length){
            debug("We still have parameters to confirm. Going to collect.");
            await this._collect();

            return this.context;
        }

        // If we have no parameters to confirm, we finish this conversation using finish method of skill.
        debug("We have no parameters to confirm anymore. Going to perform final action.");

        // Execute finish method in skill.
        await this.context.skill.finish(this.bot, this.event, this.context);

        // Double check if we have no parameters to confirm since developers can execute collect() method inside finish().
        // If there is to_confirm param at this moment, we recursively execute finish().
        if (this.context.to_confirm.length){
            debug("Found parameters to confirm. Going run finish() recursively.");

            // Re-run finish().
            return await this.finish();
        }

        // Log skill status.
        log.skill_status(this.bot.extract_sender_id(), this.context.skill.type, "completed");

        // If this is sub skill, we concat previous message and get parent context back.
        if (this.context._digging){
            if (!(Array.isArray(this.context._parent) && this.context._parent.length > 0)){
                throw new Error("It seems we had been digging but parent context not found.");
            }
            const parent = this.context._parent.pop();
            debug(`We finished sub skill and get back to parent skill "${parent.intent.name}".`);
            parent.previous.message = this.context.previous.message.concat(parent.previous.message);
            this.context = parent;
            this.context._digging = false;

            return this.context;
        }
        
        // Check clear_context_on_finish.
        if (this.context.skill.clear_context_on_finish){
            // We clear context.
            debug(`Mark this context should be cleared.`);
            this.context._clear = true
        } else {
            // We keep context. But we still discard param change history.
            this.context.param_change_history = [];
        }

        return this.context;
    }
};
