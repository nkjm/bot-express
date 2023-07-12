"use strict"

module.exports = async (bot, event, context, message_text) => {
    if (message_text === `reaction test`){
        const intent = {
            name: `robot_response`,
            parameters: {
                message_text: `message text of sample reaction. channel id is ${bot.env.CHANNEL_ID}`
            }
        }
        return intent
    }
}