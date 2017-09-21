"use strict";

module.exports = class ServiceSupport {

    /**
    * Send help request to predefined supporter.
    @param {Bot} bot - Bot object.
    @param {String} supporter - Comma separated list of supporters user id.
    @param {Object} message - Message object to send to supporters.
    @return {Promise}
    */
    static send(bot, supporter, message){
        let messages = [];
        messages.push(message);
        messages.push({
            type: "template",
            altText: `返信しますか？`,
            template: {
                type: "button",
                text: "返信しますか？",
                actions: [
                    {type:"postback", label:"返信", data:`${bot.extract_sender_id()} に返信します。`}
                ]
            }
        })

        let supporter_ids = supporter.split(",");
        if (supporter_ids.length === 0){
            // If no supporters are configured, we skip sending help message.
            return Promise.resolve();
        }

        return bot.multicast(supporter_ids, messages).then(
            (response) => {
                return response;
            }
        );
    }

}
