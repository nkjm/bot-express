"use strict";

const debug = require('debug')('bot-express:skill');
const zip_code = require("../sample_service/zip-code");
const mecab = require("mecabaas-client");
const support = require("../sample_service/support");

module.exports = class SkillJuminhyo {

    constructor(){
        this.required_parameter = {
            type: {
                message_to_confirm: {
                    type: "template",
                    altText: "住民票ですね。今回必要なのは世帯全員分ですか？あるいはご本人だけ？",
                    template: {
                        type: "buttons",
                        text: "住民票ですね。今回必要なのは世帯全員分ですか？あるいはご本人だけ？",
                        actions: [
                            {type:"message", label:"世帯全員分", text:"世帯全員分"},
                            {type:"message", label:"本人だけ", text:"本人だけ"}
                        ]
                    }
                },
                parser: async (value, bot, event, context) => {
                    if (["世帯全員分", "本人だけ"].includes(value)){
                        return value;
                    }
                    throw new Error();
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        return;
                    }

                    bot.queue({text: `${value}ですね。OKです。`});
                }
            },
            name: {
                message_to_confirm: {
                    type: "text",
                    text: "次にご本人のことを少々。お名前教えてもらえますか？"
                },
                parser: async (value, bot, event, context) => {
                    return mecab.parse(value).then(
                        (response) => {
                            let name = {};
                            for (let elem of response){
                                if (elem[3] == "人名" && elem[4] == "姓"){
                                    name.lastname = elem[0];
                                } else if (elem[3] == "人名" && elem[4] == "名"){
                                    name.firstname = elem[0];
                                }
                            }
                            return name;
                        },
                        (response) => {
                            throw new Error();
                        }
                    );
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return;

                    if (value && value.lastname && value.firstname){
                        // We got Lastname & Firstname so going to check with user if this is correct.
                        bot.collect({
                            is_name_correct: {
                                message_to_confirm: {
                                    type: "template",
                                    altText: `一応ご確認を。${value.lastname} ${value.firstname}さんでよかったでしょうか？`,
                                    template: {
                                        type: "confirm",
                                        text: `一応ご確認を。${value.lastname} ${value.firstname}さんでよかったでしょうか？`,
                                        actions: [
                                            {type: "message", label: "はい", text: "はい"},
                                            {type: "message", label: "いいえ", text: "いいえ"}
                                        ]
                                    }
                                },
                                parser: (value, bot, event, context) => {
                                    const acceptable_values = ["はい", "いいえ"];
                                    if (acceptable_values.indexOf(value) >= 0){
                                        return value;
                                    }
                                    throw new Error();
                                },
                                reaction: (error, value, bot, event, context) => {
                                    if (error) return;

                                    if (value == "はい"){
                                        bot.queue({
                                            text: "ハイカラなお名前じゃないですか〜。いいですね。"
                                        });
                                    } else {
                                        bot.queue({
                                            text: "大変失礼しました。ご面倒ですが姓と名を順に教えていただきたく。"
                                        });
                                        bot.collect("lastname");
                                    }
                                }
                            }
                        });
                    } else {
                        // We got limited information about Name so going to ask for the user.
                        bot.queue({text: `すいません、私不勉強なものでどれが姓でどれが名かわかりませんでした。ご面倒ですがそれぞれ順に教えていただきたく。`});
                        bot.collect("lastname");
                    }
                }
            },
            zip_code: {
                message_to_confirm: {
                    type: "text",
                    text: "郵便番号を教えていただけますか？"
                },
                parser: async (value, bot, event, context) => {
                    return zip_code.search(value).then(
                        (response) => {
                            // In case we could not find the address.
                            if (response == null){
                                return {
                                    zip_code: value,
                                    resolved_address: null
                                };
                            }

                            // In case we could find the address.
                            let address = response.address1 + response.address2 + response.address3;
                            return {
                                zip_code: value,
                                resolved_address: address
                            };
                        },
                        (response) => {
                            throw new Error();
                        }
                    );
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error){
                        if (error.message == "zip code format is incorrect."){
                            // Provide zip code is incorrect.
                            bot.change_message_to_confirm("zip_code", {
                                type: "text",
                                text: "なんだか郵便番号が正しくないような気がします。もう一度教えていただいてもいいですか？"
                            });
                            return;
                        } else {
                            // While provided zip code is correct, zip code search is not working.
                            bot.queue({
                                type: "text",
                                text: "すみません、郵便番号検索が不調のようで該当する住所を探せませんでした。"
                            });
                            bot.collect("address");
                            return;
                        }
                    }

                    if (!value.resolved_address){
                        // While provided zip code seems correct, we could not find the address.
                        bot.queue({
                            type: "text",
                            text: "すみません、郵便番号に該当する住所が見つかりませんでした。"
                        });
                        bot.collect("address");
                        return;
                    }

                    // It seems we could find the corresponding address.

                    // Set resolved address as city.
                    context.confirmed.city = context.confirmed.zip_code.resolved_address;

                    bot.collect({
                        is_city_correct: {
                            message_to_confirm: {
                                type: "template",
                                altText: `住所は「${context.confirmed.zip_code.resolved_address}」で間違いないですか？（はい・いいえ）`,
                                template: {
                                    type: "confirm",
                                    text: `住所は「${context.confirmed.zip_code.resolved_address}」で間違いないですか？`,
                                    actions: [
                                        {type:"message", label:"はい", text:"はい"},
                                        {type:"message", label:"いいえ", text:"いいえ"}
                                    ]
                                }
                            },
                            parser: (value, bot, event, context) => {
                                const acceptable_values = ["はい", "いいえ"];
                                if (acceptable_values.indexOf(value) >= 0){
                                    return value;
                                }
                                throw new Error();
                            },
                            reaction: (error, value, bot, event, context) => {
                                if (error) return;

                                if (value == "はい"){
                                    // Going to collect remaining street address.
                                    bot.collect("street");
                                } else if (value == "いいえ"){
                                    bot.collect({
                                        zip_code: {
                                            message_to_confirm: {
                                                type: "text",
                                                text: "なんと。もう一度郵便番号うかがってもいいですか？"
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
            },
            social_id: {
                message_to_confirm: {
                    type: "text",
                    text: "最後に身分証をカメラで撮って送ってもらえますか？"
                }
            }
        }

        this.optional_parameter = {
            lastname: {
                message_to_confirm: {
                    type: "text",
                    text: "氏名（姓）を教えてもらえますか？"
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return;

                    bot.collect("firstname");
                }
            },
            firstname: {
                message_to_confirm: {
                    type: "text",
                    text: "氏名（名）を教えてもらえますか？"
                },
                reaction: async (error, value, bot, event, context) => {
                    if (error) return;

                    bot.queue({text: `${context.confirmed.lastname} ${value}さん、なかなかナウい名前ですね。`});
                }
            },
            street: {
                message_to_confirm: {
                    type: "text",
                    text: "OK. では残りの番地を教えていただけますか？"
                }
            },
            address: {
                message_to_confirm: {
                    type: "text",
                    text: "ご住所を教えていただけますか？"
                }
            }
        }

        this.clear_context_on_finish = true;
    }

    async finish(bot, event, context){
        let address = context.confirmed.address || context.confirmed.city + context.confirmed.street;
        let name;
        if (context.confirmed.is_name_correct == "はい"){
            name = context.confirmed.name.lastname + " " + context.confirmed.name.firstname;
        } else {
            name = context.confirmed.lastname + " " + context.confirmed.firstname;
        }
        let messages = {
            type: "text",
            text: `${name}さん、完璧です。${address}が身分証のご住所と一致しているか担当者がチェックし、問題なければご住所に住民票をお届けしますね。手数料は代引きで300円です。`
        };
        await bot.reply(messages);
    }
};
