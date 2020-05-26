"use strict";

require("dotenv").config();

const REQUIRED_OPTIONS = {
    common: []
}
const DEFAULT_SKILL_PATH = "../../../skill/";
const DEFAULT_TRANSLATION_LABEL_PATH = "../../../translation/label.js";
const DEFAULT_MESSAGE_PATH = "../../../message/";
const DEFAULT_PARAMETER_PATH = "../../../parameter/";
const DEFAULT_INTENT = "input.unknown";
const DEFAULT_SKILL = "builtin_default";
const DEFAULT_LANGUAGE = "ja";
const DEFAULT_PARALLEL_EVENT = "ignore";

const express = require("express");
const router = express.Router();
const body_parser = require("body-parser");
const debug = require("debug")("bot-express:index");
const Webhook = require("./webhook");

// Context free libs
const Logger = require("./logger");
const Memory = require("./memory");
const Nlu = require("./nlu");
const Parser = require("./parser");
const Messenger = require("./messenger");

router.use(body_parser.json());

/**
bot-express module. This module should be mounted on webhook URI and requires configuration as options parameter.
@module bot-express
@param {Object} options - Configuration of bot-express.
@param {Object} [options.language="ja"] - ISO-639-1 based language code which is the mother language of this chatbot.
@param {Object} options.messenger - Messenger configuration. line, facebook and google are supported.
@param {Object | Array.<Object>} [options.messenger.line] - Messenger configuration for LINE. You can support multiple channel by providing array of this object.
@param {String} [options.messenger.line.channel_id] - Channel ID of Messaging API. Required when you use LINE as messenger.
@param {String} [options.messenger.line.channel_secret] - Channel Secret of Messaging API. Required when you use LINE as messenger.
@param {String} [options.messenger.line.channel_access_token] - Long term channle access token of Messaging API. This is not required since we use channel id and secret to issue access token.
@param {String} [options.messenger.line.switcher_secret] - Switcher Secret of Messaging API. Required when you use Switcher API.
@param {String} [options.messenger.line.token_retention=86400] - Channel Access Token retention in second.
@param {String} [options.messenger.line.token_store="memory-cache"] - Datbase to store channel access token.
@param {Object} [options.messenger.line.redis_client] - Instance of redis client. Valid in case toke_store is redis.
@param {String} [options.messenger.line.endpoint="api.line.me"] - Change Messaging API endpoint hostname.
@param {String} [options.messenger.line.api_version="v2"] - Change Messaging API version.
@param {Object} [options.messenger.facebook] - Messenger configuration of facebook.
@param {String} [options.messenger.facebook.app_secret] - Facebook App Secret. Required when you use Facebook Messenger.
@param {Array.<Object>} [options.messenger.facebook.page_access_token] - Array of a pair of Facebook Page Id and Page Access Token. Required when you use Facebook Messenger.
@param {String} [options.messenger.facebook.page_access_token.page_id] - Facebook Page Id.
@param {String} [options.messenger.facebook.page_access_token.page_access_token] - Facebook Page Access Token.
@param {String} [options.messenger.facebook.verify_token=options.facebook_app_secret] - Facebook token to verify webook url. This is only used in initial webhook registration.
@param {Object} [options.messenger.google] - Messenger configuration for Google Assistant.
@param {String} [options.messenger.google.project_id] - Project ID of Google Platform. Required when you use Google Assistant as messenger.
@param {Object | Array.<Object>} options.nlu - Option object for NLU Service. You can use mutiple agents by channel by providing array of this object.
@param {String} [options.nlu.type="dialogflow"] - NLU service. Supported service is dialogflow.
@param {String} [options.nlu.channel_id] - Channel ID to use this NLU agent. Required if you use multiple agents.
@param {Object} options.nlu.options - NLU Configuration depending on the specific NLU service. As for Dialogflow, key_filename or (project_id, client_email and private key) is required.
@param {Array.<Object>} [options.parser] - Array of option object for Parser Service.
@param {String} [options.parser[].type] - Name of the builtin parser. Supported value is "dialogflow".
@param {Object} [options.parser[].options] - Option object for the builtin parser.
@param {Object} [options.memory] - Option object for memory to store context.
@param {String} [options.memory.type="memory-cache"] - Store type of context. Supported store type is memory-cache and redis.
@param {Number} [options.memory.retention="600"] - Lifetime of the context in seconds.
@param {Object} [options.memory.options] - Options depending on the specific store type.
@param {Object} [options.logger] - Option object for logger.
@param {String} [options.logger.type] - Logger type. Supported logger is located under logger directory.
@param {Array.<String>} [options.logger.exclude] - List to disable logging. Supported values are "skill-status" and "chat".
@param {String} [options.logger.options] - Options depending on the specific logger.
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
@param {String} [options.message_path="./message/"] - Path to the directory which contains message scripts.
@param {String} [options.parameter_path="./parameter/"] - Path to the directory which contains parameter scripts. Parameter scripts is used as parameter generator.
@param {String} [options.parallel_event="ignore"] - Flag to decide the behavior in receiving parallel event. If set to "ignore", bot ignores the event during processing the event from same user. Supported value are "ignore" and "allow".
@param {Object} [options.translator] - Option object for translator.
@param {String} [options.translator.label_path="./translation/label.js"] - Path to prepared translation label file.
@param {String} [options.translator.type="google"] - Type of external translator.
@param {Boolean} [options.translator.enable_lang_detection=true] - Flag to enable language detection using external translator.
@param {Boolean} [options.translator.enable_translation=false] - Flag to enable translation using external translator. The translation is used to detect intent.
@param {Object} [options.translator.options] - Option for the specified translator.
@param {String} [options.pass_through_webhook] - Webhook URL to pass event through.
*/
module.exports = (options) => {
    debug("\nBot Express\n");

    // Set optional options.
    options.language = options.language || DEFAULT_LANGUAGE;
    options.default_intent = options.default_intent || DEFAULT_INTENT;
    options.skill = options.skill || {};
    options.skill.default = options.skill.default || DEFAULT_SKILL;
    options.parallel_event = options.parallel_event || DEFAULT_PARALLEL_EVENT;

    // Skill will be required in flow. So path should be relative path from flow.
    if (options.skill_path){
        options.skill_path = "../../../" + options.skill_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development"){
        // This is for Bot Express development environment only.
        options.skill_path = "../sample_skill/";
    } else {
        options.skill_path = DEFAULT_SKILL_PATH;
    }

    // Message will be required in flow. So path should be relative path from flow.
    if (options.message_path){
        options.message_path = "../../../" + options.message_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development"){
        // This is for Bot Express development environment only.
        options.message_path = "../sample_message/";
    } else {
        options.message_path = DEFAULT_MESSAGE_PATH;
    }

    // Parameter will be required in flow. So path should be relative path from flow.
    if (options.parameter_path){
        options.parameter_path = "../../../" + options.parameter_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development"){
        // This is for Bot Express development environment only.
        options.parameter_path = "../sample_parameter/";
    } else {
        options.parameter_path = DEFAULT_PARAMETER_PATH;
    }

    // Translator will be required in bot. So path should be relative path from bot.
    options.translator = options.translator || {};
    if (options.translator.label_path){
        options.translator.label_path = "../../../" + options.translator.label_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development"){
        // This is for Bot Express development environment only.
        options.translator.label_path = "../sample_translation/label.js";
    } else {
        options.translator.label_path = DEFAULT_TRANSLATION_LABEL_PATH;
    }

    options.facebook_verify_token = options.facebook_verify_token || options.facebook_app_secret;

    // Check if common required options are set.
    for (let req_opt of REQUIRED_OPTIONS["common"]){
        if (typeof options[req_opt] == "undefined"){
            throw new Error(`Required option: "${req_opt}" not set`);
        }
    }
    debug("Common required options all set.");

    // Instantiate request and context free classes so that we don't have to do it in every single requests.
    const logger = new Logger(options.logger || {});
    const memory = new Memory(options.memory || {}, logger);
    const nlu = new Nlu(options.nlu || {});
    const parser = new Parser(options.parser || {});


    // Webhook Process
    router.post('/', async (req, res, next) => {
        // If this is production environment and request is not from google, we return 200 OK.
        if (!["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
            if (!req.get("google-actions-api-version")){
                res.sendStatus(200);
            }
        }

        // Check header and identify which platform this request comes from.
        let messenger_type;
        if (req.get("X-Line-Signature") && req.body.events){
            messenger_type = "line";
        } else if (req.get("X-Hub-Signature") && req.body.object == "page"){
            messenger_type = "facebook";
        } else if (req.get("google-actions-api-version")){
            messenger_type = "google";
        } else {
            debug(`This event comes from unsupported message platform. Skip processing.`);
            if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
                res.sendStatus(200);
            }
            return;
        }
        debug(`Messenger is ${messenger_type}`)

        // Check if corresponding messenger configuration has been set for this request.
        if (!options.messenger[messenger_type]){
            debug(`bot-express has not been configured to handle message from ${messenger_type} so we skip this event.`)
            if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
                res.sendStatus(200)
            }
            return
        }

        // Instantiate messenger instance.
        const messenger = new Messenger(options.messenger, messenger_type);
        debug("Messenger instantiated.");

        // Validate signature.
        if (!messenger.validate_signature(req)){
            debug(`Signature validation failed.`)
            if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
                res.sendStatus(200)
            }
            return
        }
        debug("Signature validation succeeded.");

        /*
        We need to uncomment below in case of google assistant.
        options.req = req;
        options.res = res;
        */

        const webhook = new Webhook(options, { logger, memory, nlu, parser, messenger });

        let context;
        try {
            context = await webhook.run(req.body)
        } catch(e){
            debug("Abnormal End of Webhook. Error follows.");
            debug(e);
            if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
                if (e && e.name && e.message){
                    return res.status(400).json({
                        name: e.name,
                        message: e.message,
                    });
                } else {
                    return res.sendStatus(400);
                }
            }
        }

        debug("Successful End of Webhook.");

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
