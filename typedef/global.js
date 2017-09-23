/**
Object which contains context information.
@typedef {Object} context
@prop {String} to_confirm - Array of parameter names to confirm.
@prop {Sting} confirming - Parameter name which Bot is now confirming.
@prop {Object} confirmed - Object which contains confirmed value of the parameters as properties. If you want to retrieve confirmed value of "date" parameter, access confirmed.date.
@prop {Object} previous - Object which contains conversation history in the current context.
@prop {Array.<Object>} previous.confirmed - Previously confirmed parameter.
@prop {Array.<Object>} previous.message - Array of message object exchanged so far.
@prop {String} previous.message[].from - "bot" or "user"
@prop {MessageObject} previous.message[].message - Message object sent or received.
@prop {Object} intent - Intent object which contains various information about current intent based on response from NLP.
@prop {String} intent.name - Intent name detected by NLP
@prop {String} intent.text_response - Text response provided by NLP.
@prop {Array.<Object>} intent.parameters - Entities identified by NLP
@prop {Skill} skill - Skill object currelty applied.
@prop {String} sender_language - Automatically detected senders language.
*/
