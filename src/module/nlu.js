"use strict";

const debug = require("debug")("bot-express:nlu");
const default_service = "dialogflow";
const fs = require("fs");

/**
 * Natural Language Processing Abstraction Class. *Context free
 * @class
 */
class Nlu {

    /**
    * @constructor
    * @param {Object | Array.<Object>} options
    * @param {String} [options.type="dialogflow"] - NLU Service. Supported services are located in nlu directory.
    * @param {String} [options.channel_id] - Channel ID to use this NLU agent. Required if you use multiple agents.
    * @param {Object} options.options - Options depending on the NLU service.
    */
    constructor(options = {}){
        let options_list
        if (Array.isArray(options)){
            options_list = options;
        } else {
            options_list = [options];
        }

        // We instantiate all agents since this process is only conducted at the very first time of starting node server.
        this.agent_list = []
        for (const options of options_list){
            // Set default nlu type.
            options.type = options.type || default_service;

            const script_list = fs.readdirSync(__dirname + "/nlu");
            for (const script of script_list){
                if (!script.match(/.js$/)){
                    // Skip directory or other non-js file.
                    continue;
                }
                if (script.replace(".js", "") === options.type){
                    debug("Found plugin for specified NLU service. Loading " + script + "...");
                    const Service = require("./nlu/" + options.type)
                    const agent = new Service(options.options)
                    if (options_list.length > 1 && !options.channel_id){
                        throw new Error(`channel_id is not set while there are multiple agent configurations.`)
                    }
                    agent.channel_id = options.channel_id
                    this.agent_list.push(agent)
                }
            }

            if (this.agent_list.length === 0){
                throw new Error("No NLU connection has been established.");
            }
        }
    }

    /**
    Identify the intent of given sentence.
    @function
    @param {String} sentence - Sentence to identify intent.
    @param {Object} options - Option.
    @param {String} options.session_id - Session ID of this conversation.
    @param {String} [options.channel_id] - Channel ID of this conversation. Required if multiple agents are configured.
    @param {String} [options.language] - Language of the sentence.
    @returns {intent} intent - Intent Object.
    */
    identify_intent(sentence, options){
        let agent
        if (this.agent_list.length === 1){
            agent = this.agent_list[0]
        } else {
            if (!options.channel_id){
                throw new Error(`channel_id is not set while there are multiple agents.`)
            }
            agent = this.agent_list.find(agent => agent.channel_id === options.channel_id)
            if (!agent){
                throw new Error(`No agent found for channel ${options.channel_id}.`)
            }
        }
        return agent.identify_intent(sentence, options);
    }
}

module.exports = Nlu;
