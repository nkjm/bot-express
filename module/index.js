"use strict";

require("dotenv").config();

const REQUIRED_OPTIONS = {
    common: []
}
const DEFAULT_SKILL_PATH = "../../../../skill/";
const DEFAULT_INTENT = "input.unknown";
const DEFAULT_SKILL = "builtin_default";
const DEFAULT_NLP = "dialogflow";
const DEFAULT_LANGUAGE = "ja";
const DEFAULT_PARALLEL_EVENT = "ignore";

const express = require("express");
const router = express.Router();
const body_parser = require("body-parser");
const debug = require("debug")("bot-express:index");
const Webhook = require("./webhook");
const Memory = require("./memory");

router.use(body_parser.json({
    verify: (req, res, buf, encoding) => {
        req.raw_body = buf;
    }
}));

/**
bot-express module. This module should be mounted on webhook URI and requires configuration as options parameter.
@module bot-express
@param {Object} options - Configuration of bot-express.
@param {Object} [options.language="ja"] - ISO-639-1 based language code which is the mother language of this chatbot.
@param {Object} options.messenger - Messenger configuration. line, facebook and google are supported.
@param {Object} [options.messenger.line] - Messenger configuration for LINE.
@param {String} [options.messenger.line.channel_id] - Channel ID of Messaging API. Required when you use LINE as messenger.
@param {String} [options.messenger.line.channel_secret] - Channel Secret of Messaging API. Required when you use LINE as messenger.
@param {String} [options.messenger.line.endpoint="api.line.me"] - Test purpose onlyl. Change Messaging API endpoint hostname.
@param {Object} [options.messenger.facebook] - Messenger configuration of facebook.
@param {String} [options.messenger.facebook.app_secret] - Facebook App Secret. Required when you use Facebook Messenger.
@param {Array.<Object>} [options.messenger.facebook.page_access_token] - Array of a pair of Facebook Page Id and Page Access Token. Required when you use Facebook Messenger.
@param {String} [options.messenger.facebook.page_access_token.page_id] - Facebook Page Id.
@param {String} [options.messenger.facebook.page_access_token.page_access_token] - Facebook Page Access Token.
@param {String} [options.messenger.facebook.verify_token=options.facebook_app_secret] - Facebook token to verify webook url. This is only used in initial webhook registration.
@param {Object} [options.messenger.google] - Messenger configuration for Google Assistant.
@param {String} [options.messenger.google.project_id] - Project ID of Google Platform. Required when you use Google Assistant as messenger.
@param {String} options.nlu - Option object for NLU Service.
@param {String} [options.nlu.type="dialogflow"] - NLU service. Supported service is dialogflow.
@param {Object} options.nlu.options - NLU Configuration depending on the specific NLU service. As for Dialogflow, key_filename or (project_id, client_email and private key) is required.
@param {Array.<Object>} [options.parser] - Array of option object for Parser Service.
@param {String} [options.parser[].type] - Name of the builtin parser. Supported value is "dialogflow".
@param {Object} [options.parser[].options] - Option object for the builtin parser.
@param {Object} [options.memory] - Option object for memory to store context.
@param {String} [options.memory.type="memory-cache"] - Store type of context. Supported store type is memory-cache and redis.
@param {Number} [options.memory.retention="600"] - Lifetime of the context in seconds.
@param {Object} [options.memory.options] - Options depending on the specific store type.
@param {Object} [options.skill] - Options to set skill corresponding to certain event.
@param {String} [options.skill.default] - Skill name to be used when we cannot identify the intent. Default is builtin echo-back skill which simply reply text response from NLP.
@param {Object} [options.skill.beacon] - Skill to be used when bot receives beacon event.
@param {String} [options.skill.beacon.enter] - Skill to be used when bot receives beacon enter event.
@param {String} [options.skill.beacon.leave] - Skill to be used when bot receives beacon leave event.
@param {String} [options.skill.follow] - Skill to be used when bot receives follow event.
@param {String} [options.skill.unfollow] - Skill to be used when bot receives unfollow event.
@param {String} [options.skill.join] - Skill to be used when bot receives join event.
@param {String} [options.skill.leave] - Skill to be used when bot receives leave event.
@param {String} [options.default_intent="input.unknown"] - Intent name to be returned by NLP when it cannot identify the intent.
@param {String} [options.modify_previous_parameter_intent] - Intent name to modify the previously collected parameter.
@param {String} [options.skill_path="./skill/"] - Path to the directory which contains skill scripts.
@param {String} [options.auto_translation] - Flag to enable auto translation. Set this value to "enable" to enable auto translation. When set to "enable", you need to set options.google_project_id and GOOGLE_APPLICATION_CREDENTIALS environment variables.
@param {String} [options.parallel_event="ignore"] - Flag to decide the behavior in receiving parallel event. If set to "ignore", bot ignores the event during processing the event from same user. Supported value are "ignore" and "allow".
@param {String} [options.google_project_id] - Google Project Id to be used when you want to enable auto translation.
@param {String} [options.google_api_key] - Google API Key for translattion.
@param {Object} [options.translator] - Option object for translator.
@param {String} [options.translator.type="google"] - Translator type.
@param {Boolean} [options.translator.enable_lang_detection=true] - Flag to enable language detection.
@param {Boolean} [options.translator.enable_translation=false] - Flag to enable translation. The translation is used to detect intent.
@param {Object} [options.translator.options] - Option for the specified translator.
*/
module.exports = (options) => {
    debug("\nBot Express\n");

    // Set optional options.
    options.language = options.language || DEFAULT_LANGUAGE;
    options.default_intent = options.default_intent || DEFAULT_INTENT;
    options.skill = options.skill || {};
    options.skill.default = options.skill.default || DEFAULT_SKILL;
    options.parallel_event = options.parallel_event || DEFAULT_PARALLEL_EVENT;
    if (!!options.skill_path){
        options.skill_path = "../../../../" + options.skill_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development"){
        // This is for Bot Express development environment only.
        options.skill_path = "../../sample_skill/";
    } else {
        options.skill_path = DEFAULT_SKILL_PATH;
    }
    options.facebook_verify_token = options.facebook_verify_token || options.facebook_app_secret;

    // Check if common required options are set.
    for (let req_opt of REQUIRED_OPTIONS["common"]){
        if (typeof options[req_opt] == "undefined"){
            throw new Error(`Required option: "${req_opt}" not set`);
        }
    }
    debug("Common required options all set.");

    const memory = new Memory(options.memory);

    // Webhook Process
    router.post('/', async (req, res, next) => {
        if (!["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
            if (!req.get("google-actions-api-version")){
                res.sendStatus(200);
            }
        }

        options.req = req;
        options.res = res;
        options.memory = memory;

        let webhook = new Webhook(options);

        let context;
        try {
            context = await webhook.run();
        } catch(e){
            debug("Abnormal End of Webhook. Error follows.");
            debug(e);
            if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
                if (e && e.message){
                    return res.status(400).send(e.message);
                } else {
                    return res.sendStatus(400);
                }
            }
        }

        debug("Successful End of Webhook. Current context follows.");
        debug(JSON.stringify(context));

        if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
            return res.json(context);
        }
    });

    // Verify Facebook Webhook
    router.get("/", (req, res, next) => {
        if (!options.facebook_verify_token){
            debug("Failed validation. facebook_verify_token not set.");
            return res.sendStatus(403);
        }
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === options.facebook_verify_token) {
            debug("Validating webhook");
            return res.status(200).send(req.query['hub.challenge']);
        } else {
            debug("Failed validation. Make sure the validation tokens match.");
            return res.sendStatus(403);
        }
    });

    return router;
}
