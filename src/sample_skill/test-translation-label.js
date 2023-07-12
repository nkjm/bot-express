"use strict";

module.exports = class TestTranslationLabel {
    constructor(){
        this.required_parameter = {
            pizza: {
                message_to_confirm: async (bot, event, context) => {
                    const message = {
                        type: "text",
                        text: await bot.t("which_pizza")
                    }
                    return message;
                }
            },
            review_price: {
                message_to_confirm: async (bot, event, context) => {
                    const message = {
                        type: "text",
                        text: await bot.t("its_x_yen", { amount: "1200" })
                    }
                    return message;
                }
            }
        }
    }

    async finish(bot, event, context){

    }
}