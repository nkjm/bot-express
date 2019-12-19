"use strict";

const debug = require("debug")("bot-express:messenger");
const fs = require("fs");

/**
 * Messenger abstraction. *Context free
 * @class
 */
class Messenger {
    /**
     * @constructor 
     * @param {Object} options 
     * @param {String} messenger_type - line | facebook | google
     */
    constructor(options, messenger_type){
        this.type = messenger_type;
        this.Messenger_classes = {};
        this.plugin = {};

        // Load messenger libraries located under messenger directory.
        let messenger_scripts = fs.readdirSync(__dirname + "/messenger");
        for (let messenger_script of messenger_scripts){
            let messenger_type = messenger_script.replace(".js", "");

            // Even if there is messenger implementation, we won't load it if corresponding messenger option is not configured.
            if (!options[messenger_type]){
                continue;
            }

            debug("Loading " + messenger_script + "...");

            this.Messenger_classes[messenger_type] = require("./messenger/" + messenger_script);
            this.plugin[messenger_type] = new this.Messenger_classes[messenger_type](options[messenger_type]);
            if (messenger_type === this.type){
                this.service = this.plugin[messenger_type];
            }
        }
    }

    validate_signature(req){
        return this.service.validate_signature(req);
    }

    async refresh_token(){
        await this.service.refresh_token();
    }

    extract_events(body){
        return this.Messenger_classes[this.type].extract_events(body);
    }

    extract_beacon_event_type(event){
        return this.Messenger_classes[this.type].extract_beacon_event_type(event);
    }

    extract_param_value(event){
        return this.Messenger_classes[this.type].extract_param_value(event);
    }

    extract_postback_payload(event){
        return this.Messenger_classes[this.type].extract_postback_payload(event);
    }

    check_supported_event_type(event, flow){
        return this.Messenger_classes[this.type].check_supported_event_type(event, flow);
    }

    /**
    * Extract message of the event.
    * @param {EventObject} event - Event to extract message.
    * @returns {MessageObject} - Extracted message.
    */
    extract_message(event){
        return this.Messenger_classes[this.type].extract_message(event);
    }

    /**
    * Extract message text of the event.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String} - Extracted message text.
    */
    extract_message_text(event){
        return this.Messenger_classes[this.type].extract_message_text(event);
    }

    /**
    * Extract sender's user id.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String}
    */
    extract_sender_id(event){
        return this.Messenger_classes[this.type].extract_sender_id(event);
    }

    /**
    * Extract session id.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String}
    */
    extract_session_id(event){
        return this.Messenger_classes[this.type].extract_session_id(event);
    }

    /**
    * Extract channel id.
    * @param {Object} event - Event to extract channel id.
    * @returns {String}
    */
    extract_channel_id(event){
        return this.service.extract_channel_id(event);
    }

    /**
    * Extract reciever's user/room/group id.
    * @param {EventObject} event - Event to extract message text.
    * @returns {String}
    */
    extract_to_id(event){
        if (event.type == "bot-express:push"){
            return event.to[`${event.to.type}Id`];
        }
        return this.Messenger_classes[this.type].extract_to_id(event);
    }

    /**
    * Identify the event type.
    * @param {EventObject} event - Event to identify event type.
    * @returns {String} - Event type. In case of LINE, it can be "message", "follow", "unfollow", "join", "leave", "postback", "beacon". In case of Facebook, it can be "echo", "message", "delivery", "read", "postback", "optin", "referral", "account_linking".
    */
    identify_event_type(event){
        if (event.type && event.type.match(/^bot-express:/)){
            return event.type;
        }
        return this.Messenger_classes[this.type].identify_event_type(event);
    }

    /**
    * Identify the message type.
    * @param {MessageObject} message - Message object to identify message type.
    * @returns {String} In case of LINE, it can be "text", "image", "audio", "video", "file", "location", "sticker", "imagemap", "buttons_template, "confirm_template" or "carousel_template".
    * In case of Facebook, it can be "text", "image", "audio", "video", "file", "button_template", "generic_template", "list_template", "open_graph_template", "receipt_template", "airline_boardingpass_template", "airline_checkin_template", "airline_itinerary_template", "airline_update_template".
    */
    identify_message_type(message){
        return this.Messenger_classes[this.type].identify_message_type(message);
    }

    get_secret(){
        return this.service.get_secret()
    }

    /**
     * Pass event through specified webhook.
     * @method
     * @async
     * @param {String} webhook - URL to pass through event. 
     * @param {String} secret - Secret key to create signature.
     * @param {Object} event - Event object to pass through.
     */
    async pass_through(webhook, secret, event){
        return this.service.pass_through(webhook, secret, event)
    }

    /**
    * Reply messages to sender to collect parameter
    * @param {Object} event - Event object.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Array.<Promise>}
    */
    async reply_to_collect(event, messages){
        return this.service.reply_to_collect(event, messages);
    }

    /**
    * Reply messages to sender.
    * @param {Object} event - Event object.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Promise.<Object>}
    */
    async reply(event, messages){
        return this.service.reply(event, messages);
    }

    /**
    * Send(Push) message to specified user.
    * @param {Object} event - Event object.
    * @param {String} recipient_id - Recipient user id.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Array.<Promise>}
    */
    async send(event, recipient_id, messages){
        return this.service.send(event, recipient_id, messages);
    }

    /**
    * Push messages to multiple users.
    * @param {Array.<String>} recipient_ids - The array of recipent user id.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Array.<Promise>}
    */
    async multicast(event, recipient_ids, messages){
        return this.service.multicast(event, recipient_ids, messages);
    }

    /**
    * Push messages to all users.
    * @param {Array.<MessageObject>} messages - The array of message objects.
    * @returns {Array.<Promise>}
    */
    async broadcast(event, messages){
        return this.service.broadcast(event, messages);
    }

    /**
    * Compile message format to the specified format.
    * @param {MessageObject} message - Message object to compile.
    * @param {String} format - Target format to compile. It can be "line" or "facebook".
    * @returns {Promise.<MessageObject>} - Compiled message object.
    */
    async compile_message(message, format = this.type){
        let source_format = this._identify_message_format(message);
        debug(`Identified message format is ${source_format}.`);

        let compiled_message;

        if (format != source_format){
            debug(`Compiling message from ${source_format} to ${format}...`);

            // Identify message type.
            let message_type = this.Messenger_classes[source_format].identify_message_type(message);
            debug(`message type is ${message_type}`);

            // Compile message
            compiled_message = this.Messenger_classes[format].compile_message(source_format, message_type, message);
            debug(`Compiled message is following.`);
            debug(compiled_message);
        } else {
            compiled_message = JSON.parse(JSON.stringify(message));
            debug(`Compiled message is following.`);
            debug(compiled_message);
        }

        return compiled_message;
    }

    /**
    * Identify the message format.
    * @private
    * @param {MessageObject} message - Message object to identify message format.
    * @returns {String} - Message format.
    */
    _identify_message_format(message){
        let message_format;
        if (!!message.type){
            message_format = "line";
        } else {
            let message_keys = Object.keys(message).sort();
            if (!!message.quick_replies || !!message.attachment || !!message.text){
                // Provider is facebook. Type is quick reply.
                message_format = "facebook";
            } else if (typeof message === "string"){
                message_format = "google";
            }
        }
        if (!message_format){
            // We could not identify the format of this message object.
            throw new Error(`We can not identify the format of this message object.`);
        }
        return message_format;
    }
}

module.exports = Messenger;
