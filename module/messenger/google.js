"use strict";

const request = require("request");
const crypto = require("crypto");
const debug = require("debug")("bot-express:messenger");
const { ActionsSdkApp } = require('actions-on-google');
const REQUIRED_PARAMETERS = ["project_id"];

Promise.promisifyAll(request);

module.exports = class MessengerGoogle {

    constructor(options){
        for (let p of REQUIRED_PARAMETERS){
            if (!options.messenger.google[p]){
                throw new Error(`Required parameter: "${p}" for Google Assistant configuration not set.`);
            }
        }

        this.project_id = options.messenger.google.project_id;
        this.sdk = new ActionsSdkApp({
            request: options.req,
            response: options.res
        });
    }

    async refresh_token(){
        return;
    }

    async multicast(event, to, messages){
        throw new Error("This method is not supported.");
    }

    async send(event, to, messages){
        throw new Error("This method is not supported.");
    }

    async reply_to_collect(event, messages){
        return this.reply(event, messages, true);
    }

    async reply(event, messages, to_collect){
        // If this is test, we will not actually issue call out.
        if (["development", "test"].includes(process.env.BOT_EXPRESS_ENV)){
            debug("This is test so we skip the actual call out.");
            return;
        }
        if (!messages || !messages.length || messages.length === 0){
            throw new Error("No message found");
        }
        if (messages.length === 1){
            if (to_collect){
                return this.sdk.ask(messages[0]);
            }
            return this.sdk.tell(messages[0]);
        }
        let concated_message = "";
        let offset = 1;
        messages.forEach(message => {
            if (typeof message === "string"){
                concated_message += message;
                if (offset < messages.length){
                    concated_message += "\n";
                }
            } else {
                if (message.speech) concated_message += message.speech;
                if (message.title) concated_message += message.title;
            }
            offset++;
        })
        if (concated_message === ""){
            throw new Error("No message found");
        }
        if (to_collect){
            return this.sdk.ask(concated_message);
        }
        return this.sdk.tell(concated_message);
    }

    async validate_signature(req){
        return this.sdk.isRequestFromGoogle(this.project_id);
    }

    static extract_events(body){
        return [body];
    }

    static identify_event_type(event){
        if (!event.conversation || !event.conversation.type){
            return "unidentified";
        }
        return event.conversation.type;
    }

    static extract_beacon_event_type(event){
        throw new Error("This method is not supported.");
    }

    static extract_sender_id(event){
        return event.user.userId;
    }

    static extract_session_id(event){
        return event.conversation.conversationId;
    }

    static extract_to_id(event){
        throw new Error("This method is not supported.");
    }

    static extract_param_value(event){
        return event.inputs[0].rawInputs[0].query;
    }

    static extract_message(event){
        return event.inputs[0].rawInputs[0];
    }

    static extract_message_text(event){
        return event.inputs[0].rawInputs[0].query;
    }

    static extract_postback_payload(event){
        throw new Error("This method is not supported.");
    }

    static check_supported_event_type(event, flow){
        return true; // Tentative
    }

    static identify_message_type(message){
        return "VOICE";
    }

    static compile_message(message_format, message_type, message){
        return MessengerGoogle[`_compile_message_from_${message_format}_format`](message_type, message);
    }

    static _compile_message_from_line_format(message_type, message){
        // Facebook format has Text, Audio, Image, Video, File, Button Template, Generic Template, List Template, Open Graph Template, Receipt Template, Airline Boarding Ticket Template, Airline Checkin Template, Airline Itinerary Tempalte, Airline Fight Update Template.
        // quick_replies may be included in any Content-Type.
        // buttons may be included in Templates.

        // ### Threshold for quick_replies
        // -> elements of quick_replies has to be up to 11.
        // -> title in each element has to be up to 20 chars.
        // -> payload in each element has to be 1000 chars.

        // ### Threshold for Text ###
        // -> text has to be up to 640 chars.

        // ### Threshold for Button Template ###
        // -> text has to be up to 640 chars.
        // -> buttons has to be up to 3.
        // -> each button must follow button threshold.

        // ### Threshold for Generic Template ###
        // -> elements has to be up to 10.
        // -> title in each elements has to be up to 80 chars.
        // -> subtitle in each elements has to be up to 80 chars.
        // -> buttons in each elements has to be up to 3.
        // -> each button must follow button threshold.

        // ### Threshold for List Template ###
        // -> elements has to be from 2 to 4.
        // -> global button has to be up to 1.
        // -> title in each elements has to be up to 80 chars.
        // -> subtitle in each elements has to be up to 80 chars.
        // -> button in each elements has to be up to 1.
        // -> each button must follow button threshold.

        // ### Compile Rule Overview
        // -> text: to text
        // -> image: to image
        // -> video: to video
        // -> audio: to audio
        // -> file: to unsupported text
        // -> location: to location *NEED TEST
        // -> sticker: to unsupported text
        // -> imagemap: to unsupported text
        // -> buttons template: to text(w quick reply) or button tempalte
        // -> confirm template: to text(w quick reply) or button template
        // -> carousel template: to generic template

        let compiled_message;

        switch(message_type){
            case "text": {// -> to text
                compiled_message = message.text;
                break;
            }
            case "image": {// -> to image
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
            case "video": {// -> to video
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
            case "audio": {// -> to audio
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
            case "file": {// -> unsupported text
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
            case "location": {// to location *NEED TEST
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
            case "sticker": {// -> to unsupported text
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
            case "imagemap": {// -> to unsupported text
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
            case "buttons_template": {// -> to text(w quick reply) or button tempalte
                compiled_message = message.template.text;
                break;
                /*
                let uri_included = false;
                let datetimepicker_included = false;

                for (let action of message.template.actions){
                    if (action.type == "uri"){
                        uri_included = true;
                    }
                    if (action.type == "datetimepicker"){
                        datetimepicker_included = true;
                    }
                }

                if (uri_included){
                    // This template message include uri button so we use template message in facebook as well.
                    if (message.template.actions.length > 3){
                        // Not supported since facebook does not allow template message including more than 3 buttons. The threshold of action of line template button is 4.
                        debug(`Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message.`);
                        compiled_message = {
                            text: message.altText + " *Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message."
                        }
                        break;
                    }
                    compiled_message = {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "button",
                                text: message.template.text,
                                buttons: []
                            }
                        }
                    }
                    for (let action of message.template.actions){
                        if (action.type == "uri"){
                            compiled_message.attachment.payload.buttons.push({
                                type: "web_url",
                                url: action.uri,
                                title: action.label
                            });
                        } else if (action.type == "postback"){
                            compiled_message.attachment.payload.buttons.push({
                                type: "postback",
                                title: action.label,
                                payload: action.data
                            });
                        } else if (action.type == "message"){
                            compiled_message.attachment.payload.buttons.push({
                                type: "postback",
                                title: action.label,
                                payload: action.text
                            });
                        }
                        // We remove datetimepicker button since its not supported in facebook.
                    }
                } else {
                    // This template message does not include uri.
                    // If the number of button is just 1 and it is datetimepicker, we create plane text message.
                    // Otherwise, it can be postback or message so we use quick reply.

                    if (datetimepicker_included && message.template.actions.length == 1){
                        // Message has datetimepicker which is not supported in facebook.
                        // We compile this message to plane text.
                        compiled_message = {
                            text: message.altText
                        }
                    } else {
                        compiled_message = {
                            text: message.template.text,
                            quick_replies: []
                        }
                        for (let action of message.template.actions){
                            if (action.type == "postback"){
                                compiled_message.quick_replies.push({
                                    content_type: "text",
                                    title: action.label,
                                    payload: action.data
                                });
                            } else if (action.type == "message"){
                                compiled_message.quick_replies.push({
                                    content_type: "text",
                                    title: action.label,
                                    payload: action.text
                                });
                            }
                        }
                    }
                }
                break;
                */
            }
            case "confirm_template": {// -> to text(w quick reply) or button tempalte
                compiled_message = message.template.text;
                break;
                /*
                let uri_included = false;
                let datetimepicker_included = false;

                for (let action of message.template.actions){
                    if (action.type == "uri"){
                        uri_included = true;
                    }
                    if (action.type == "datetimepicker"){
                        datetimepicker_included = true;
                    }
                }

                if (uri_included){
                    // This template message include uri button so we use template message in facebook as well.
                    if (message.template.actions.length > 3){
                        // Not supported since facebook does not allow template message including more than 3 buttons. The threshold of action of line template button is 4.
                        debug(`Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message.`);
                        compiled_message = {
                            text: message.altText + " *Compiling template message including more than 3 buttons including uri button from line format to facebook format is not supported. So we compile it to text message."
                        }
                        break;
                    }
                    compiled_message = {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "button",
                                text: message.template.text,
                                buttons: []
                            }
                        }
                    }
                    for (let action of message.template.actions){
                        if (action.type == "uri"){
                            compiled_message.attachment.payload.buttons.push({
                                type: "web_url",
                                url: action.uri,
                                title: action.label
                            });
                        } else {
                            compiled_message.attachment.payload.buttons.push({
                                type: "postback",
                                title: action.label,
                                payload: action.data
                            });
                        }

                    }
                } else {
                    // This template message does not include uri.
                    // If the number of button is just 1 and it is datetimepicker, we create plane text message.
                    // Otherwise, it can be postback or message so we use quick reply.

                    if (datetimepicker_included && message.template.actions.length == 1){
                        // Message has datetimepicker which is not supported in facebook.
                        // We compile this message to plane text.
                        compiled_message = {
                            text: message.altText
                        }
                    } else {
                        compiled_message = {
                            text: message.template.text,
                            quick_replies: []
                        }
                        for (let action of message.template.actions){
                            if (action.type == "postback"){
                                compiled_message.quick_replies.push({
                                    content_type: "text",
                                    title: action.label,
                                    payload: action.data
                                });
                            } else if (action.type == "message"){
                                compiled_message.quick_replies.push({
                                    content_type: "text",
                                    title: action.label,
                                    payload: action.text
                                });
                            }
                        }
                    }
                }
                break;
                */
            }
            case "carousel_template": {// -> generic template
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
            default: {
                debug(`*Message type is LINE's ${message_type} and it is not supported in Google.`);
                compiled_message = "";
                break;
            }
        }
        return compiled_message
    }

    /**
    @deprecated
    */
    static translate_message(translater, message_type, message, sender_language){
        throw new Error("This method is not supported.");
        /*
        switch(message_type){
            case "text": {
                return translater.translate(message.text, sender_language).then(
                    (response) => {
                        message.text = response[0];
                        debug("Translated message follows.");
                        debug(message);
                        return message;
                    }
                );
                break;
            }
            case "buttons_template":
            case "confirm_template": {
                let source_texts = [message.altText, message.template.text];
                for (let action of message.template.actions){
                    source_texts.push(action.label);
                    if (action.type == "message"){
                        source_texts.push(action.text);
                    }
                }
                return translater.translate(source_texts, sender_language).then(
                    (response) => {
                        message.altText = response[0][0];
                        message.template.text = response[0][1];
                        let offset = 2;
                        for (let action of message.template.actions){
                            action.label = response[0][offset];
                            offset++;
                            if (action.type == "message"){
                                action.text = response[0][offset];
                                offset++;
                            }
                        }
                        debug("Translated message follows.");
                        debug(message);
                        if (message.template.actions){
                            debug("Actions follows");
                            debug(message.template.actions);
                        }
                        return message;
                    }
                );
                break;
            }
            case "carousel_template": {
                let source_texts = [message.altText];
                for (let column of message.template.columns){
                    if (column.title) source_texts.push(column.title);
                    source_texts.push(column.text);

                    for (let action of column.actions){
                        source_texts.push(action.label);
                        if (action.type == "message"){
                            source_texts.push(action.text);
                        }
                    }
                }
                return translater.translate(source_texts, sender_language).then(
                    (response) => {
                        message.altText = response[0][0];

                        let offset = 1;
                        for (let column of message.template.columns){
                            if (column.title){
                                column.title = response[0][offset];
                                offset++;
                            }
                            column.text = response[0][offset];
                            offset++;

                            for (let action of column.actions){
                                action.label = response[0][offset];
                                offset++;
                                if (action.type == "message"){
                                    action.text = response[0][offset];
                                    offset++;
                                }
                            }
                        }
                        debug("Translated message follows.");
                        debug(message);
                        return message;
                    }
                );
                break;
            }
            default: {
                return Promise.resolve(message);
                break;
            }
        }
        */
    }
};
