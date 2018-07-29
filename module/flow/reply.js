"use strict";

/*
** Import Packages
*/
const Promise = require('bluebird');
const debug = require("debug")("bot-express:flow");
const Flow = require("./flow");

module.exports = class ReplyFlow extends Flow {

    constructor(messenger, event, context, options) {
        context._flow = "reply";
        super(messenger, event, context, options);
    }

    async run(){
        debug("### This is Reply Flow. ###");

        // Check if this event type is supported in this flow.
        if (!this.messenger.check_supported_event_type(this.event, "reply")){
            debug(`This is unsupported event type in this flow so skip processing.`);
            return this.context;
        }

        let param_value = this.messenger.extract_param_value(this.event);

        let is_postback = false;
        if (this.bot.type == "line"){
            if (this.event.type == "postback") is_postback = true;
        } else if (this.bot.type == "facebook"){
            if (this.event.postback) is_postback = true;
        }

        // Language translation.
        if (super.translator && super.translator.enable_translation){
            if (!is_postback && typeof param_value == "string"){
                debug(`Automatic translation has not been introduced.`);
            }
        }

        debug("Going to perform super.apply_parameter().");
        try {
            let applied_parameter = await super.apply_parameter(this.context.confirming, param_value);
            if (applied_parameter == null){
                debug("Parameter was not applicable. We skip reaction and go to finish.");
            } else {
                await super.react(null, applied_parameter.key, applied_parameter.value);
            }
        } catch (e) {
            if (e && e.name === "BotExpressParseError"){
                let mind = await super.identify_mind(param_value);

                if (mind.result == "modify_previous_parameter"){
                    await super.modify_previous_parameter();
                } else if (mind.result == "dig"){
                    await super.dig(mind.intent);
                } else if (mind.result == "restart_conversation"){
                    await super.restart_conversation(mind.intent);
                } else if (mind.result == "change_intent"){
                    await super.change_intent(mind.intent);
                } else if (mind.result == "change_parameter"){
                    /**
                    Now there is no chance to run this case since detecting change parameter in reply flow is very likely to be false positive.
                    */
                    let applied_parameter = await super.change_parameter(response.parameter.key, param_value)
                    await super.react(null, applied_parameter.key, applied_parameter.value);
                } else if (mind.result == "no_idea"){
                    await super.react(e, this.context.confirming, param_value);
                }
            } else {
                throw e;
            }
        }

        return await super.finish();
    }
}
