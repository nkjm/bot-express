/**
 * Class to implement skill.
 * @class Skill
 * @param {Object} config - Object which contains skill specific configurations.
 * @prop {Skill#skill_parameter_container} required_parameter - Object to list required parameters for the skill.
 * @prop {Skill#skill_parameter_container} optional_parameter - Object to list optional parameters for the skill.
 * @prop {boolean} clear_context_on_finish=false - Flag to flush context information on skill finishes. Set true to flush.
 */

/**
 * Function which is triggerd at first.
 * @async
 * @method Skill#begin
 * @memberof Skill
 * @param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
 * @param {Object} event - Event object which triggers this flow.
 * @param {context} context - Context information.
 */

/**
 * Function which is triggerd when all the required parameters are collected.
 * @async
 * @method Skill#finish
 * @memberof Skill
 * @param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
 * @param {Object} event - Event object which triggers this flow.
 * @param {context} context - Context information.
 */

/**
 * Object which defines how this parameter should be collected, parsed, and reacted.
 * @typedef {Object} Skill#skill_parameter
 * @prop {Object|Skill#message_to_confirm} message_to_confirm - Message Object to ask for users the value of this parameter. As for message format, you can use either LINE or Facebook Messenger. In addition, you can also set function to generate message dynamically.
 * @prop {Skill#parser_function|String|Skill#parser_object} parser - Function to parse the message from user. Function, string and object can be provided. In case of function, it is used as it is. In case of string, you can specify the type of built-in parser. In case of object, you can specify parser_object.
 * @prop {Skill#reaction} reaction - Function to react to the message from user. Reaction runs right after paser returns.
 * @prop {Array.<String>} sub_skill - List of sub skills. If user intends these skills in the middle of the conversation, we switch context to new intent and get back once finished.
 */

/**
 * Object which contains one skill parameter.
 * @typedef {Object} Skill#skill_parameter_container
 * @prop {Skill#skill_parameter} * - Skill parameter object.
 */

/**
 * Function to generate message to confirm the value of teh parameter.
 * @typedef {Function} Skill#message_to_confirm
 * @async
 * @param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
 * @param {Object} event - Event object which triggers this flow.
 * @param {context} context - Context information.
 * @return {Object} You have to return message object.
 */

/**
 * Function which is applied to the message from user to validate the value. If validation succeeds, return any type of value you like to set as confirmed parameter. If validation fails, throw error.
 * @typedef {Function} Skill#parser_function
 * @async
 * @param {*} value - Data to parse. In case of text message, its text will be set in string. In case of postback event, data payload will be set in string. In other cases, message object will be set as it is.
 * @param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
 * @param {Object} event - Event object which triggers this flow.
 * @param {context} context - Context information.
 */

/**
 * The object of built-in parser configuratin.
 * @typedef {Object} Skill#parser_object
 * @property {String} type - Type of built-in parser. Supported value is dialogflow, email, list, number and string.
 * @property {Object} policy - Policy configuration depending on the each parser implementation.
 */

/**
 * Function which is triggered when parser finshed parsing. You can implement custom behavior on collecting parameter  including async action.
 * @typedef {Function} Skill#reaction
 * @async
 * @param {Boolean} error - Flag which indicates if parser accepted the value. When accepted, true is set.
 * @param {*} value - Parsed value.
 * @param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
 * @param {Object} event - Event object which triggers this flow.
 * @param {context} context - Context information.
 */
