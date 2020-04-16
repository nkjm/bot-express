"use strict";

const debug = require("debug")("bot-express:flow");
const Bot = require("./bot"); // Libraries to be exposed to skill.
const Context = require("./context");

module.exports = class Flow {
    constructor(options, slib, event, context){
        this.options = options;
        this.slib = slib;
        this.event = event;
        this.context = context;
        this.bot = new Bot(this.options, this.slib, this.event, this.context);

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
     * @method 
     * @param {Object} event
     * @return {Boolean}
     */
    is_intent_postback(event){
        if (this.bot.identify_event_type() !== "postback") return false;
        
        let payload = this.slib.messenger.extract_postback_payload(event);

        try {
            payload = JSON.parse(payload);
        } catch(e) {
            debug(`Postback payload.data is not JSON format so this is not intent postback.`);
            return false;
        }

        if (typeof payload !== "object") return false;
        if (payload._type !== "intent" && payload.type !== "intent") return false;
        
        if (!(payload.intent && payload.intent.name)){
            throw new Error(`It seems this is intent postback but intent is not correctly set.`);
        }

        debug(`This is intent postback.`);
        return true;
    }

    /**
     * @method 
     * @param {Object} event
     * @return {Boolean}
     */
    is_process_parameters_postback(event){
        if (this.bot.identify_event_type() !== "postback") return false;

        let payload = this.slib.messenger.extract_postback_payload(event);

        try {
            payload = JSON.parse(payload);
        } catch(e) {
            debug(`Postback payload.data is not JSON format so this is not process parameters postback.`);
            return false;
        }

        if (typeof payload !== "object") return false;
        if (payload._type !== "process_parameters" && payload.type !== "process_parameters") return false;
        
        if (!payload.parameters){
            throw new Error(`It seems this is process parameters postback but parameters is not set.`);
        }

        debug(`This is process parameters postback.`);
        return true;
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
            let Skill = require("./skill/default");
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
            skill.path = this.options.skill_path;
        }

        skill.type = skill_name;

        // Set message instance.
        const message_script = skill.message || skill.type
        try {
            require.resolve(`${this.options.message_path}${message_script}`);
        } catch (e){
            debug(`Message "${message_script}" not found in ${this.options.message_path}.`)
            return skill;
        }
        debug(`Message "${message_script}" found. Loading..`);
        const Message = require(`${this.options.message_path}${message_script}`);
        this.bot.m = new Message(this.bot.translator);

        return skill;
    }

    identify_to_confirm_parameter(required_parameter, confirmed = {}){
        let to_confirm = []; // Array of parameter names.

        // If there is no required_parameter, we just return empty array.
        if (!required_parameter){
            return to_confirm;
        }

        // Scan confirmed parameters and if missing required parameters found, we add them to to_confirm.
        for (let req_param_name of Object.keys(required_parameter)){
            if (typeof confirmed[req_param_name] == "undefined"){
                to_confirm.push(req_param_name);
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

        this.context.param_change_history.forEach((orig_log) => {
            let log = JSON.parse(JSON.stringify(orig_log))
            if (log.param.message){
                if (typeof log.param.message === "string"){
                    debug(`message is string. We try to make it function...`);
                    try {
                        log.param.message = Function.call(skill, "return " + log.param.message)();
                    } catch (error) {
                        debug(`message looks like just a string so we use it as it is.`);
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
            if (log.param.preaction){
                log.param.preaction = Function.call(skill, "return " + log.param.preaction)();
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
            }
            if (log.param.generator){
                if (!(log.param.generator.file && log.param.generator.method)){
                    throw Error(`Generator of ${log.name} is not correctly set.`)
                }
                const Generator = require(`${this.options.parameter_path}${log.param.generator.file}`)
                const generator = new Generator()
                if (!generator[log.param.generator.method]) throw Error(`${log.param.generator.file} does not have ${log.param.generator.method}`)
                log.param = generator[log.param.generator.method](log.param.generator.options)
            }
            if (skill[log.type][log.name] === undefined){
                skill[log.type][log.name] = log.param;
                return;
            }
            Object.assign(skill[log.type][log.name], log.param);
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

        // Retrieve parameter to collect next.
        // If the parameter has sub parameters, pop_parameter_to_collect checkout the sub parameters.
        // If there is no more to_confirm, it returns null.
        const param = await this.pop_parameter_to_collect();

        if (!param){
            if (this.context._sub_parameter && this.context._parent_parameter.list){
                // While there is no parameters to confirm, this is sub parameter. There is a chance to be able to apply some more parameter.
                const parent_parameter = JSON.parse(JSON.stringify(this.context._parent_parameter));
                const sub_parameter_list = Object.keys(this.context.confirmed);

                await this.apply_sub_parameters();

                // If input parameter still has value for the parameter, we process it again.
                if (sub_parameter_list.length > 0 && Array.isArray(parameters[sub_parameter_list[0]]) && parameters[sub_parameter_list[0]].length > 0){
                    this.bot.collect(parent_parameter.name);
                }
                
                return await this.process_parameters(parameters);
            }

            debug("There is no parameters to confirm for now but we save the input parameters as heard just in case. Exit process parameters.");
            Object.assign(this.context.heard, parameters);
            return;
        }

        if (parameters[param.name] === undefined || parameters[param.name] === [] || parameters[param.name] === ""){
            debug(`Input parameters does not contain "${param.name}" which we should process now. We save the rest of input parameters as heard in context and exit process parameters.`);
            Object.assign(this.context.heard, parameters);
            return;
        }

        // Take preaction.
        await this.bot.preact(param.name)

        // Parse and add parameter.
        let param_value = parameters[param.name];
        // If this is sub parameter and parent parameter is list and input parameter is array, we apply them one by one.
        if (this.context._sub_parameter && this.context._parent_parameter.list && Array.isArray(parameters[param.name])){
            param_value = parameters[param.name][0];
        }
        const applied_parameter = await this.apply_parameter(param.name, param_value, true)

        // Take reaction.
        await this.bot.react(applied_parameter.error, applied_parameter.param_name, applied_parameter.param_value);

        // Delete processed parameter.
        const updated_parameters = JSON.parse(JSON.stringify(parameters));
        // If this is sub parameter and parent parameter is list and input parameter is array, we remove element from array. 
        if (this.context._sub_parameter && this.context._parent_parameter.list && Array.isArray(updated_parameters[applied_parameter.param_name])){
            updated_parameters[applied_parameter.param_name].shift();
            // If the number of elements turned to 0, we delete the input param.
            if (updated_parameters[applied_parameter.param_name].length === 0){
                delete updated_parameters[applied_parameter.param_name];
            }
        } else {
            delete updated_parameters[applied_parameter.param_name];
        }

        debug("Updated input parameters follow.");
        debug(updated_parameters);
        
        await this.process_parameters(updated_parameters);
    }

    async change_parameter(param_name, param_value){
        return this.apply_parameter(param_name, param_value, true)
    }

    /**
     * Parse and add parameter to context.
     * @method
     * @async
     * @param {String} param_name
     * @param {*} param_value
     * @param {Boolean} [implicit=false]
     * @return {Object}
     */
    async apply_parameter(param_name, param_value, implicit = false){
        debug(`Applying parameter.`);

        if (this.bot.check_parameter_type(param_name) === "not_applicable"){
            debug("This is not the parameter we should care about. Skipping.");
            return;
        }

        // Parse parameter.
        let parse_error;
        try {
            param_value = await this.bot.parse_parameter(param_name, param_value);
        } catch (e){
            if (e.name === "Error"){
                // This should be intended exception in parser.
                parse_error = e;
                debug(`Parser rejected value for parameter: "${param_name}".`)
                if (e.message){
                    debug(e.message);
                }
            } else {
                // This should be unexpected exception so we just throw error.
                throw e;
            }
        }

        if (parse_error === undefined){
            debug(`Parser accepted the value. Parsed value for parameter: "${param_name}" follows.`);
            debug(param_value);
    
            // Add parameter to context.
            this.bot.add_parameter(param_name, param_value, implicit);
        }

        return {
            error: parse_error,
            param_name: param_name,
            param_value: param_value
        }
    }

    async apply_sub_parameters(){
        if (!(Array.isArray(this.context._parent) && this.context._parent.length > 0)){
            throw new Error(`There is no parent context.`)
        }

        const parent_context = this.context._parent.shift()
        if (this.context._parent_parameter.name !== parent_context.confirming){
            throw new Error(`Parent parameter name defined in sub context differs from confirming of parent context.`)
        }

        debug(`Saving sub parameters to parent parameter: "${this.context._parent_parameter.name}".`)

        const collected_sub_parameters = JSON.parse(JSON.stringify(this.context.confirmed))
        const collected_heard = JSON.parse(JSON.stringify(this.context.heard))
        const message_queue = JSON.parse(JSON.stringify(this.context._message_queue))
        delete parent_context.reason
        parent_context.previous.message = this.context.previous.message.concat(parent_context.previous.message)
        
        // Get parent context back while keeping object pointer by Object.assgin().
        Object.assign(this.context, parent_context)
        Object.assign(this.context.heard, collected_heard)
        Object.assign(this.context._message_queue, message_queue)

        // Apply collected sub parameters to parent parameter.
        await this.bot.apply_parameter({
            name: this.context.confirming, 
            value: collected_sub_parameters
        })
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
     * @returns {String} response.parameter.name - Parameter name.
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
        intent = await this.slib.nlu.identify_intent(payload, {
            session_id: this.bot.extract_session_id(),
            channel_id: this.bot.extract_channel_id(),
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
                const param = this.bot.get_parameter(this.context.confirming);

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
        let all_param_name_list = [];
        if (this.context.skill.required_parameter){
            all_param_name_list = all_param_name_list.concat(Object.keys(this.context.skill.required_parameter));
        }
        if (this.context.skill.optional_parameter){
            all_param_name_list = all_param_name_list.concat(Object.keys(this.context.skill.optional_parameter));
        }

        debug("all_param_name_list are following.");
        debug(all_param_name_list);

        let parameters_parsed = [];
        for (let param_name of all_param_name_list){
            if (param_name === this.context.confirming){
                continue;
            }
            debug(`Check if "${payload}" is suitable for ${param_name}.`);
            parameters_parsed.push(
                this.bot.parse_parameter(param_name, payload, true).then(
                    (response) => {
                        debug(`Value fits to ${param_name}.`);
                        return {
                            is_fit: true,
                            name: param_name,
                            value: response
                        }
                    }
                ).catch(
                    (e) => {
                        if (e.name === "Error"){
                            debug(`Value does not fit to ${param_name}`);
                            return {
                                is_fit: false,
                                name: param_name,
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
                            name: fit_parameters[0].name,
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
                            name: fit_parameters[0].name,
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
        if (!(this.context.previous && Array.isArray(this.context.previous.processed) && this.context.previous.processed.length > 0)){
            debug(`There is no processed parameter.`);
            return;
        }

        const param_name = this.context.previous.processed[0]

        // Check if there is corresponding parameter in skill just in case.
        if (this.bot.check_parameter_type(param_name) == "not_applicable") {
            debug(`"${param_name}" not found in skill.`);
            return;
        }

        // Put previous parameter to to confirm queue. But this parameter may not be previously confirmed since condition might return false.
        this.bot.collect(param_name);

        // We remove this parameter from processed history.
        debug(`Removing ${param_name} from previous.processed.`);
        this.context.previous.processed.shift();

        // We remove this parameter from confirmed history.
        if (Array.isArray(this.context.previous.confirmed) && this.context.previous.confirmed.length > 0){
            if (this.context.previous.confirmed[0] === param_name){
                debug(`Removing ${param_name} from previous.confirmed.`);
                this.context.previous.confirmed.shift();
            } else {
                debug(`We rewrind one more processed parameter since previously processed parameter has not been confirmed.`);
                return this.modify_previous_parameter();
            }
        }
    }

    /**
     * @method
     * @async
     * @param {Object} intent
     */
    async restart_conversation(intent){
        const context = new Context({
            intent: intent,
            flow: this.context._flow,
            event: this.context.event,
            sender_language: this.context.sender_language
        })
        // Using Object.assign for updating context to keep original reference.
        Object.assign(this.context, context);

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
        await this.slib.logger.skill_status(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "launched", {
            context: this.context
        });

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
    async dig(intent){

        this.checkout_sub_skill();

        return this.change_intent(intent);
    }

    /**
     * @method
     * @async
     * @param {Object} intent 
     */
    async change_intent(intent){
        // Get archive of current context.
        const archive = Context.get_archive(this.context);

        // We keep following properties.
        const context = new Context({
            intent: intent,
            flow: this.context._flow,
            event: this.context.event,
            sender_language: this.context.sender_language,
            _parent: this.context._parent,
            _sub_skill: this.context._sub_skill
        })
        context.archive = archive;

        // Using Object.assign for updating context to keep original reference. Otherwise, reference of context between flow and bot or other script become different.
        Object.assign(this.context, context);
        
        // Re-instantiate skill since some params might been added dynamically.
        if (this.context.intent && this.context.intent.name){
            let skill = this.instantiate_skill(this.context.intent);

            if (!skill){
                debug(`While it seems user tries to change intent, we ignore it since we have no corresponding skill.`);
                return;
            }

            this.context.skill = skill;
        }

        // Take over previous parameters depending on the take_over_parameter config of skill.
        if (this.context.skill.take_over_parameter){
            this.context.global = JSON.parse(JSON.stringify(context.archive[0].global))
            this.context.confirmed = JSON.parse(JSON.stringify(context.archive[0].confirmed))
            this.context.heard = JSON.parse(JSON.stringify(context.archive[0].heard))
        }

        // At the very first time of the conversation, we identify to_confirm parameters by required_parameter in skill file.
        // After that, we depend on context.to_confirm to identify to_confirm parameters.
        if (this.context.to_confirm.length == 0){
            this.context.to_confirm = this.identify_to_confirm_parameter(this.context.skill.required_parameter, this.context.confirmed);
        }
        debug(`We have ${this.context.to_confirm.length} parameters to confirm.`);

        // Log skill status.
        await this.slib.logger.skill_status(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "launched", {
            context: this.context
        });

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
     * @method
     * @async
     * @return {Object} parameter
     */
    async pop_parameter_to_collect(){
        // Check if there is parameter to confirm.
        if (this.context.to_confirm.length == 0){
            debug("There is no parameter to confirm anymore.");
            return;
        }

        // Extract parameter by name
        let param = this.bot.get_parameter(this.context.to_confirm[0]);

        // If condition is defined, we test it.
        if (param.condition){
            // Check if condition is properly implemented.
            if (typeof param.condition != "function"){
                throw new Error("Condition should be function.");
            }

            // If condition returns false, we skip this parameter.
            if (!await param.condition(this.bot, this.event, this.context)){
                // Since condition returns false, we should skip this parameter and check next parameter.
                debug(`We skip collecting "${param.name}" due to condition.`);
                this.context.previous.processed.unshift(param.name);
                this.context.to_confirm.shift();

                return await this.pop_parameter_to_collect();
            }
        }

        // If while is defined, we test it.
        if (param.list && param.while){
            // Check if while is properly implemented.
            if (typeof param.while != "function"){
                throw new Error("while should be function.");
            }

            // If while returns false, we skip this parameter.
            if (!await param.while(this.bot, this.event, this.context)){
                // Since while returns false, we should skip this parameter and check next parameter.
                debug(`We skip collecting "${param.name}" due to while.`);
                this.context.previous.processed.unshift(param.name);
                this.context.to_confirm.shift();

                return await this.pop_parameter_to_collect();
            }
        }

        // Check if this parameter has sub parameter. If does not, we simply return this param.
        if (!param.sub_parameter){
            return param;
        }
       
        // This param has sub parameter. We need to checkout it. 

        // Before checkout, we run preaction if it is set.
        if (param.preaction && typeof param.preaction === "function"){
            debug(`Preaction found. Performing..`)
            await param.preaction(this.bot, this.event, this.context)
        }

        // By checkout, current context will be save to _parent and sub parameters will be set to to_confirm and confirmed will be cleared.
        this.checkout_sub_parameter(param);

        return await this.pop_parameter_to_collect();
    }

    checkout_sub_skill(){
        debug(`Checking out sub skill..`);
        if (!Array.isArray(this.context._parent)){
            this.context._parent = [];
        }

        const parent_context = JSON.parse(JSON.stringify(this.context));
        const skill = {
            type: this.context.skill.type
        }
        delete parent_context.skill;
        parent_context.reason = "sub_skill";
        parent_context.skill = skill;
        this.context._parent.unshift(parent_context);

        // Bit _sub_skill flag.
        this.context._sub_skill = true;
    }

    checkout_sub_parameter(param){
        debug(`Checking out sub parameter of ${param.name}..`)
        if (!Array.isArray(this.context._parent)){
            this.context._parent = []
        }

        // Set parent param name to confirming.
        this.context.confirming = param.name

        // Save current context to _parent.
        const parent_context = JSON.parse(JSON.stringify(this.context))
        delete parent_context.skill
        parent_context._message_queue = []
        parent_context.reason = "sub_parameter"
        this.context._parent.unshift(parent_context)

        // Bit _sub_parameter flag.
        this.context._sub_parameter = true

        // Set sub parameters to to_confirm.
        this.context.to_confirm = Object.keys(param.sub_parameter)
        // Clear confirmed.
        this.context.confirmed = {}
        // Set parent information.
        this.context._parent_parameter = {
            type: param.type,
            name: param.name,
            list: param.list
        }
    }

    /**
     * Send/reply to user to ask to_confirm parameter.
     * @method
     * @async
     */
    async _collect(){
        // Check condition. If condition is undefined or returns true, we collect this parameter.
        // If condition returns false, we skip this parameter.
        const param = await this.pop_parameter_to_collect();
        // If there is no parameter to collect, we recursively run respond() to evaluate corrent context.
        if (!param){
            return this.respond()
        }

        // Set context.confirming.
        this.context.confirming = param.name;

        // Perform preaction.
        if (param.preaction && typeof param.preaction === "function"){
            debug(`Preaction found. Performing..`)
            await param.preaction(this.bot, this.event, this.context)
        }

        // Perform apply.
        if (param.apply && typeof param.apply === "function"){
            debug(`Apply found. Performing..`)
            const value_to_apply = await param.apply(this.bot, this.event, this.context)
            if (value_to_apply !== undefined && value_to_apply !== null){
                await this.bot.apply_parameter({
                    name: this.context.confirming,
                    value: value_to_apply,
                    implicit: true
                })
                return this.respond()
            } else {
                debug(`While performed apply, it did not return value so going to collect parameter as usual.`)
            }
        }

        // Check if there is message_to_confirm.
        if (!(param.message || param.message_to_confirm)){
            throw new Error("While we need to send a message to confirm parameter, the message not found.");
        }

        // Setting message_to_confirm.
        // If there is messenger specific message object under message_to_confirm, we use it.
        // If there is not, we use message_to_confirm.
        let message_to_confirm;
        if ((param.message && param.message[this.bot.type]) || (param.message_to_confirm && param.message_to_confirm[this.bot.type])){
            // Found message platform specific message object.
            debug("Found messenger specific message object.");
            if (param.message && param.message[this.bot.type]){
                message_to_confirm = param.message[this.bot.type]; 
            } else {
                message_to_confirm = param.message_to_confirm[this.bot.type];
            }
        } else if (param.message || param.message_to_confirm){
            // We compile this message object to get message platform specific message object.
            message_to_confirm = param.message || param.message_to_confirm;
        }

        // Setting message by compiling message_to_confirm.
        // If message_to_confirm is function, we execute it and use the response.
        // If message_to_confirm is object, we use it.
        let message;
        if (typeof message_to_confirm === "function"){
            debug("message_to_confirm is made of function. We generate message with it.");
            message = await message_to_confirm(this.bot, this.event, this.context);

            // Make sure message has been set.
            if (!message){
                throw new Error(`message_to_confirm of ${this.context.confirming} did not return message object.`);
            }
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
            try {
                await this.bot.reply_to_collect(message);
            } catch (e){
                // If failure is due to expiration of reply token, we try pushing it.
                if (e.message == "Invalid reply token"){
                    debug("We failed to reply since reply token did not work so try pushing the message.")
                    await this.bot.send(this.bot.extract_sender_id(), message, this.context.sender_language)
                    debug("Push worked.")
                } else {
                    throw (e)
                }
            }
        }
    }

    /**
     * @method
     * @async
     * @return {context}
     */
    async respond(){
        debug("Running respond()..");

        // If pause flag has been set, we stop processing remaining actions while keeping context.
        if (this.context._pause){
            debug("Detected pause flag. We stop processing.");
            this.context._pause = false;
            
            return this.context;
        }

        // If exit flag has been set, we stop processing remaining actions while keeping context except for confirming.
        if (this.context._exit){
            debug("Detected exit flag. We stop processing.");
            this.context.confirming = null;
            this.context._exit = false;

            return this.context;
        }

        // If exit flag has been set, we stop processing remaining actions and clear context completely.
        if (this.context._init){
            debug("Detected init flag. We stop processing.");
            this.context._clear = true;

            return this.context;
        }

        // If we're now confiming sub parameters, check if we got all the required parameters. 
        if (this.context._sub_parameter){
            if (Array.isArray(this.context.to_confirm) && this.context.to_confirm.length === 0){
                // We got all the required sub parameters. Set them to parent parameter.
                await this.apply_sub_parameters();

                return await this.respond();
            }
        }

        if (this.context.heard && Object.keys(this.context.heard).length > 0){
            await this.process_parameters(this.context.heard);
        }

        if (this.context.to_confirm.length){
            // If we still have parameters to confirm, we collect them.
            debug("We still have parameters to confirm. Going to collect.");
            await this._collect();

            return this.context;
        }
        
        // If we have no parameters to confirm, we finish this conversation using finish method of skill.
        debug("We have no parameters to confirm anymore. Going to perform skill.finish().");

        // Execute finish method in skill.
        await this.context.skill.finish(this.bot, this.event, this.context);

        // Double check if we have no parameters to confirm since developers can execute collect() method inside skill.finish().
        // If there is to_confirm param at this moment, we recursively execute respond().
        if (this.context.to_confirm.length){
            debug("Found parameters to confirm. Going run respond() recursively.");

            // Re-run respond().
            return await this.respond();
        }

        // Log skill status.
        await this.slib.logger.skill_status(this.bot.extract_channel_id(), this.bot.extract_sender_id(), this.context.chat_id, this.context.skill.type, "completed", {
            context: this.context
        });

        // If this is sub skill, we concat previous message and get parent context back.
        if (this.context._sub_skill && Array.isArray(this.context._parent) && this.context._parent.length > 0 && this.context._parent[0].reason === "sub_skill"){
            const parent_context = this.context._parent.shift();
            debug(`We finished sub skill and get back to parent skill "${parent_context.intent.name}".`);

            delete parent_context.reason;
            parent_context.previous.message = this.context.previous.message.concat(parent_context.previous.message);

            // Get parent context back while keeping object pointer by Object.assign().
            Object.assign(this.context, parent_context);

            return this.context;
        }
        
        // Check clear_context_on_finish.
        if (this.context.skill.clear_context_on_finish === false){
            // We keep context. But we still discard param change history.
            debug(`We keep the context since clear_context_on_finish is false`);
            this.context.param_change_history = [];
        } else {
            // We clear context.
            debug(`We will clear context.`);
            this.context._clear = true
        }

        return this.context;
    }
};
