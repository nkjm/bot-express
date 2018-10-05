/**
Class to define skill.
@class Skill
*/

/**
Constructor of skill class. Required/optional parameters can be defined in this function.
@method Skill#constructor
@memberof Skill
@prop {Skill#skill_parameter_container} required_parameter - Object to list required parameters for the skill.
@prop {Skill#skill_parameter_container} optional_parameter - Object to list optional parameters for the skill.
@prop {boolean} clear_context_on_finish=false - Flag to flush context information on skill finishes. Set true to flush.
*/

/**
Function which is triggerd at first.
@method Skill#begin
@memberof Skill
@param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
@param {Object} event - Event object which triggers this flow.
@param {context} context - Context information.
@return {Promise} You have to return the response either from resolve or reject function.
*/

/**
Function which is triggerd when all the required parameters are collected.
@method Skill#finish
@memberof Skill
@param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
@param {Object} event - Event object which triggers this flow.
@param {context} context - Context information.
@return {Promise} You have to return the response either from resolve or reject function.
*/

/**
Object which defines how this parameter should be collected, parsed, and reacted.
@typedef {Object} Skill#skill_parameter
@prop {Object|Skill#message_to_confirm} message_to_confirm - Message Object to ask for users the value of this parameter. As for message format, you can use either LINE or Facebook Messenger. In addition, you can also set function to generate message dynamically.
@prop {Skill#parser_function|String|Skill#parser_object} parser - Function to parse the message from user. Function, string and object can be provided. In case of function, it is used as it is. In case of string, you can specify the type of built-in parser. In case of object, you can specify the type of built-in parser and parameter name defined in dialogflow.
@prop {Skill#reaction} reaction - Function to react to the message from user. Reaction runs right after paser returns.
@prop {Array.<String>} sub_skill - List of sub skills. If user intends these skills in the middle of the conversation, we switch context to new intent and get back once finished.
*/

/**
Object which contains one skill parameter.
@typedef {Object} Skill#skill_parameter_container
@prop {Skill#skill_parameter} * - Skill parameter object.
*/

/**
Function to generate message to confirm the value of teh parameter.
@typedef {Function} Skill#message_to_confirm
@param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
@param {Object} event - Event object which triggers this flow.
@param {context} context - Context information.
@return {Promise} You have to return promise including message object.
*/

/**
Function which is applied to the message from user to validate the value. You can do not only validating the value but also manipulation.
@typedef {Function} Skill#parser_function
@param {String|Object} value - Data to parse. In case of text message, its text will be set in string. In case of postback event, data payload will be set in string. In other cases, message object will be set as it is.
@param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
@param {Object} event - Event object which triggers this flow.
@param {context} context - Context information.
@return {Promise} You have to return promise including parsed value or error object.
*/

/**
The object of built-in parser configuratin.
@typedef {Object} Skill#parser_object
@property {String} type - Type of built-in parser. Supported value is dialogflow.
@property {Object} policy - Policy configuration depending on the each parser implementation.
*/

/**
Function which is triggered when parser finshed parsing. You can implement custom behavior on collecting parameter  including async action.
@typedef {Function} Skill#reaction
@param {Boolean} error - Flag which indicates if parser accepted the value. When accepted, true is set.
@param {*} value - Parsed value.
@param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
@param {Object} event - Event object which triggers this flow.
@param {context} context - Context information.
@return {Promise} You have to return promise.
*/
