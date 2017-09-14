/**
Object which contains context information.
@typedef {Object} context
@prop {String} to_confirm - Array of parameter names to confirm.
@prop {Sting} confirming - Parameter name which Bot is now confirming.
@prop {Object} confirmed - Object which contains confirmed value of the parameters as properties. If you want to retrieve confirmed value of "date" parameter, access confirmed.date.
@prop {Object} previous
@prop {Array.<Object>} previous.confirmed
@prop {Array.<Object>} previous.message
@prop {String} previous.message[].from - "bot" or "user"
@prop {MessageObject} previous.message[].message
@prop {Object} intent
@prop {String} intent.name
@prop {String} intent.text_response
@prop {Array.<Object>} intent.parameters
@prop {Skill} skill
@prop {String} sender_language
*/
