/**
Object which contains context information.
@typedef {Object} context
@prop {Array.<String>} to_confirm - Array of parameter names to confirm.
@prop {Sting} confirming - Parameter name which Bot is now confirming.
@prop {Object} confirmed - Object which contains confirmed parameters. If you want to retrieve confirmed value of "date" parameter, access confirmed.date.
@prop {Object} heard - Object which contains heard parameters which are waiting for beging applied.
@prop {Object} previous - Object which contains conversation history in the current context.
@prop {Array.<Object>} previous.confirmed - Previously confirmed parameter.
@prop {Array.<Object>} previous.message - Array of message object exchanged so far.
@prop {String} previous.message[].from - "bot" or "user"
@prop {MessageObject} previous.message[].message - Message object sent or received.
@prop {Object} previous.event - Previous event
@prop {intent} intent - Intent object which contains various information about current intent based on response from NLP.
@prop {Skill} skill - Skill object currelty applied.
@prop {Array.<Object>} param_change_history - Change log to revive skill instance in the next event.
@prop {String} sender_language - Automatically detected ISO-639-1 based code of the senders language.
@prop {String} translation - Translated text of current message.
@prop {Array.<MessageObject>} _message_queue - Array of messages to be sent.
@prop {Object} _confirming_property - Information about confirming property.
@prop {String} _confirming_property.parameter_key - Parameter key which properties belong to.
@prop {String} _confirming_property.parameter_type - Parameter type which properties belong to.
@prop {Array.<String>} _confirming_property.to_confirm - Properties to confirm.
@prop {Object} _confirming_property.confirmed - Confirmed properties.
@prop {Boolean} _digging - True when digging.
@prop {Array.<context>} _parent - Array of parent context.
@prop {Boolean} _in_progress - Flag to indicate if bot is currenty processing an event from this user.
@prop {String} _flow - Flow applied to current event.
@prop {Boolean} _pause - Flag to pause.
@prop {Boolean} _exit - Flag to exit.
@prop {Boolean} _init - Flag to init context.
@prop {intent} _switch_intent - Intent object to switch skill.
*/

/**
Object which contains intent and related information.
@typedef {Object} intent
@prop {String} id - Intent id.
@prop {String} name - Intent name.
@prop {Object} parameters - Parameters found in the sentence.
@prop {String} text_response - Text response to the sentence.
@prop {Object} fulfillment - Object to fulfill the action.
*/

/**
Custom event to start conversation from Bot.
@typedef {Object} push_event
@prop {String} type - Event type. This is always "bot-express:push".
@prop {Object} to - Object which contains destination information.
@prop {String} to.type - Type of reciever. Supported values are "user", "room", "group".
@prop {String} [to.userId] - User id of reciever. Required if to.type is "user".
@prop {String} [to.roomId] - Room id of reciever. Required if to.type is "room".
@prop {String} [to.groupId] - Group id of reciever. Required if to.type is "group".
@prop {intent} intent - Intent object to be applied in this conversation.
@prop {String} language - ISO-639-1 based code of the sender's language.
*/
