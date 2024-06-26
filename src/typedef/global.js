/**
Object which contains context information.
@typedef {Object} context
@prop {Array.<String>} to_confirm - Array of parameter names to confirm.
@prop {Sting} confirming - Parameter name which Bot is now confirming.
@prop {Object} confirmed - Object which contains confirmed parameters. If you want to retrieve confirmed value of "date" parameter, access confirmed.date.
@prop {Object} heard - Object which contains heard parameters which are waiting for begging applied.
@prop {Array.<Object>} archive - Array of previous context.
@prop {Object} previous - Object which contains conversation history in the current context.
@prop {Array.<String>} previous.confirmed - Previously confirmed parameter key. It does not include skipped parameter due to condition.
@prop {Array.<String>} previous.processed - Previously processed parameter key. It includes skipped parameter due to condition.
@prop {Array.<Object>} previous.message - Array of message object exchanged so far.
@prop {String} previous.message[].from - "bot" or "user"
@prop {MessageObject} previous.message[].message - Message object sent or received.
@prop {String} previous.message[].skill - Skill in which this message was sent.
@prop {Object} previous.event - Previous event
@prop {Array.<rewind_action>} rewind - Array of rewind_action object which defines actions on rewinding parameter.
@prop {intent} intent - Intent object which contains various information about current intent based on response from NLP.
@prop {Skill} skill - Skill object currently applied.
@prop {Array.<Object>} param_change_history - Change log to revive skill instance in the next event.
@prop {String} sender_language - Automatically detected ISO-639-1 based code of the senders language.
@prop {String} translation - Translated text of current message.
@prop {Array.<MessageObject>} _message_queue - Array of messages to be sent.
@prop {Boolean} _in_progress - Flag to indicate if bot is currently processing an event from this user.
@prop {String} _flow - Flow applied to current event.
@prop {Boolean} _pause - Flag to pause.
@prop {Boolean} _exit - Flag to exit.
@prop {Boolean} _init - Flag to init context.
@prop {intent} _switch_intent - Intent object to switch skill.
@prop {Boolean} _digging - True when digging.
@prop {Array.<context>} _parent - Array of parent context.
@prop {Object} _parent_parameter - Parent parameter.
@prop {Boolean} _sub_skill - True if this is sub skill.
@prop {Boolean} _sub_parameter - True if this is sub parameter.
*/

/**
Rewind action object.
@typedef {Object} rewind_action
@prop {String} type - Supported values are "apply".
@prop {String} rewinding_parameter - On rewinding this parameter, we run the action.
@prop {String} parameter_name - Parameter name to apply value.
@prop {String} parameter_value - Value to apply.
/*

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
@prop {String} to.type - Type of receiver. Supported values are "user", "room", "group".
@prop {String} [to.userId] - User id of receiver. Required if to.type is "user".
@prop {String} [to.roomId] - Room id of receiver. Required if to.type is "room".
@prop {String} [to.groupId] - Group id of receiver. Required if to.type is "group".
@prop {intent} intent - Intent object to be applied in this conversation.
@prop {String} language - ISO-639-1 based code of the sender's language.
*/
