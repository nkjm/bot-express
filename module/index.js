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

const express = require("express");
const router = express.Router();
const body_parser = require("body-parser");
const debug = require("debug")("bot-express:index");
const Webhook = require("./webhook");

router.use(body_parser.json({
    verify: (req, res, buf, encoding) => {
        req.raw_body = buf;
    }
}));

/**
* bot-express module. This module should be mounted on webhook URI and requires configuration as options parameter.
* @module bot-express
* @param {Object} options - Configuration of bot-express.
* @param {Object} [options.language="ja"] - ISO-639-1 based code of the language which NLU and bot-express expect to receive. If the language of the received message differs from this value, bot-express can transparently translate it.
* @param {String} [options.line_channel_secret] - LINE Channel Secret. Required when you use LINE.
* @param {String} [options.line_access_token] - LINE Access Token. Required when you use LINE.
* @param {String} [options.facebook_app_secret] - Facebook App Secret. Required when you use Facebook Messenger.
* @param {Array.<Object>} [options.facebook_page_access_token] - Array of a pair of Facebook Page Id and Page Access Token. Required when you use Facebook Messenger.
* @param {String} [options.facebook_page_access_token.page_id] - Facebook Page Id.
* @param {String} [options.facebook_page_access_token.page_access_token] - Facebook Page Access Token.
* @param {String} [options.facebook_verify_token=options.facebook_app_secret] - Facebook token to verify webook url. This is only used in initial webhook registration.
* @param {String} options.nlu - Option object for NLU Service.
* @param {String} [options.nlu.type="dialogflow"] - NLU service. Supported service is dialogflow.
* @param {Object} options.nlu.options - NLU Configuration depending on the specific NLU service. As for Dialogflow, client_access_token is required.
* @param {Array.<Object>} [options.parser] - Array of option object for Parser Service.
* @param {String} [options.parser[].type] - Name of the builtin parser. Supported value is "dialogflow".
* @param {Object} [options.parser[].options] - Option object for the builtin parser.
* @param {Object} [options.memory] - Option object for memory to store context.
* @param {String} [options.memory.type="memory-cache"] - Store type of context. Supported store type is memory-cache and redis.
* @param {Number} [options.memory.retention="600"] - Lifetime of the context in seconds.
* @param {Object} [options.memory.options] - Options depending on the specific store type.
* @param {String} [options.default_skill] - Skill name to be used when we cannot identify the intent. Default is builtin echo-back skill which simply reply text response from NLP.
* @param {Object} [options.beacon_skill] - Skill to be used when bot receives beacon event.
* @param {String} [options.beacon_skill.enter] - Skill to be used when bot receives beacon enter event.
* @param {String} [options.beacon_skill.leave] - Skill to be used when bot receives beacon leave event.
* @param {String} [options.follow_skill] - Skill to be used when bot receives follow event.
* @param {String} [options.unfollow_skill] - Skill to be used when bot receives unfollow event.
* @param {String} [options.join_skill] - Skill to be used when bot receives join event.
* @param {String} [options.leave_skill] - Skill to be used when bot receives leave event.
* @param {String} [options.default_intent="input.unknown"] - Intent name to be returned by NLP when it cannot identify the intent.
* @param {String} [options.skill_path="./skill/"] - Path to the directory which contains skill scripts.
* @param {String} [options.auto_translation] - Flag to enable auto translation. Set this value to "enable" to enable auto translation. When set to "enable", you need to set options.google_project_id and GOOGLE_APPLICATION_CREDENTIALS environment variables.
* @param {String} [options.google_project_id] - Google Project Id to be used when you want to enable auto translation.
* @param {String} [options.google_api_key] - Google API Key for translattion.
*/
module.exports = (options) => {
    debug("\nBot Express\n");

    // Set optional options.
    options.language = options.language || DEFAULT_LANGUAGE;
    options.default_intent = options.default_intent || DEFAULT_INTENT;
    options.default_skill = options.default_skill || DEFAULT_SKILL;
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

    // Webhook Process
    router.post('/', (req, res, next) => {
        if (!["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
            if (!req.get("google-actions-api-version")){
                res.sendStatus(200);
            }
        }

        options.req = req;
        options.res = res;

        let webhook = new Webhook(options);
        webhook.run().then((context) => {
            debug("Successful End of Webhook. Current context follows.");
            debug(context);
            if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
                res.json(context);
            }
        }, (error) => {
            debug("Abnormal End of Webhook. Error follows.");
            debug(error);
            if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
                res.status(400).send(error.message);
            }
        });
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
