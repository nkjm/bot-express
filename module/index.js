'use strict';

const REQUIRED_OPTIONS = {
    common: []
}
const DEFAULT_MEMORY_RETENTION = 300000;
const DEFAULT_SKILL_PATH = "../../../../skill/";
const DEFAULT_INTENT = "input.unknown";
const DEFAULT_SKILL = "builtin_default";
const DEFAULT_NLP = "dialogflow";

const restify = require("restify");
const server = restify.createServer();
const body_parser = require("body-parser");
const debug = require("debug")("bot-express:index");
const Webhook = require("./webhook");

server.use(body_parser.json({
    verify: (req, res, buf, encoding) => {
        req.raw_body = buf;
    }
}));

/**
* bot-express module. This module should be mounted on webhook URI and requires configuration as options parameter.
* @module bot-express
* @param {Object} options - Configuration of bot-express.
* @param {String} [options.line_channel_secret] - LINE Channel Secret. Required when you use LINE.
* @param {String} [options.line_channel_access_token] - LINE Channel Access Token. Required when you use LINE.
* @param {String} [options.facebook_app_secret] - Facebook App Secret. Required when you use Facebook Messenger.
* @param {Array.<Object>} [options.facebook_page_access_token] - Array of a pair of Facebook Page Id and Page Access Token. Required when you use Facebook Messenger.
* @param {String} options.facebook_page_access_token.page_id - Facebook Page Id.
* @param {String} options.facebook_page_access_token.page_access_token - Facebook Page Access Token.
* @param {String} [options.facebook_verify_token=options.facebook_app_secret] - Facebook token to verify webook url. This is only used in initial webhook registration.
* @param {String} [options.nlp="dialogflow"] - NLP Service you like to use. Default is dialogflow.
* @param {Object} options.nlp_options - NLP Configuration.
* @param {String} options.nlp_options.client_access_token - Token to access to NLP service.
* @param {String} [options.nlp_options.language="ja"] - Language to recognize.
* @param {String} [options.default_skill] - Skill name to be used when we cannot identify the intent. Default is builtin echo-back skill which simply reply text response from NLP.
* @param {Object} [options.beacon_skill] - Skill to be used when bot receives beacon event.
* @param {String} [options.beacon_skill.enter] - Skill to be used when bot receives beacon enter event.
* @param {String} [options.beacon_skill.leave] - Skill to be used when bot receives beacon leave event.
* @param {String} [options.follow_skill] - Skill to be used when bot receives follow event.
* @param {String} [options.unfollow_skill] - Skill to be used when bot receives unfollow event.
* @param {String} [options.join_skill] - Skill to be used when bot receives join event.
* @param {String} [options.leave_skill] - Skill to be used when bot receives leave event.
* @param {String} [options.default_intent="input.unknown"] - Intent name to be returned by NLP when it cannot identify the intent.
* @param {Number} [options.memory_retention=6000] - Period to retain context data in bot memory in milli-seconds.
* @param {String} [options.skill_path="./skill/"] - Path to the directory which contains skill scripts.
* @param {String} [options.auto_translation] - Flag to enable auto translation. Set this value to "enable" to enable auto translation. When set to "enable", you need to set options.google_project_id and GOOGLE_APPLICATION_CREDENTIALS environment variables.
* @param {String} [options.google_project_id] - Google Project Id to be used when you want to enable auto translation.
*/
module.exports = (options) => {
    debug("\nBot Express\n");

    // Set optional options.
    options.default_intent = options.default_intent || DEFAULT_INTENT;
    options.default_skill = options.default_skill || DEFAULT_SKILL;
    options.memory_retention = options.memory_retention || DEFAULT_MEMORY_RETENTION;
    options.nlp = options.nlp || DEFAULT_NLP;
    if (!!options.skill_path){
        options.skill_path = "../../../../" + options.skill_path;
    } else if (process.env.BOT_EXPRESS_ENV == "development"){
        // This is for Bot Express development environment only.
        options.skill_path = "../../sample_skill/";
    } else {
        options.skill_path = DEFAULT_SKILL_PATH;
    }
    if (options.enable_ask_retry === null){
        options.enable_ask_retry = false;
    }
    options.message_to_ask_retry = options.message_to_ask_retry || "ごめんなさい、もうちょっと正確にお願いできますか？";
    options.facebook_verify_token = options.facebook_verify_token || options.facebook_app_secret;

    // Check if common required options are set.
    for (let req_opt of REQUIRED_OPTIONS["common"]){
        if (typeof options[req_opt] == "undefined"){
            throw new Error(`Required option: "${req_opt}" not set`);
        }
    }
    debug("Common required options all set.");

    // Webhook Process
    server.post('/', (req, res, next) => {
        res.send(200);

        let webhook = new Webhook(options);
        webhook.run(req).then(
            (context) => {
                debug("Successful End of Webhook. Current context follows.");
                debug(context);
            },
            (response) => {
                debug("Abnormal End of Webhook. Error follows.");
                debug(response);
            }
        );
    });

    // Verify Facebook Webhook
    server.get("/", (req, res, next) => {
        if (!options.facebook_verify_token){
            debug("Failed validation. facebook_verify_token not set.");
            return res.send(403);
        }
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === options.facebook_verify_token) {
            debug("Validating webhook");
            return res.send(200, req.query['hub.challenge']);
        } else {
            debug("Failed validation. Make sure the validation tokens match.");
            return res.send(403);
        }
    });

    return server;
}
