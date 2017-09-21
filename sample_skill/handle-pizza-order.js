'use strict';

let debug = require("debug")("bot-express:skill");
let mecab = require("mecabaas-client");

module.exports = class SkillHandlePizzaOrder {

    // コンストラクター。このスキルで必要とする、または指定することができるパラメータを設定します。
    constructor() {
        this.required_parameter = {
            pizza: {
                message_to_confirm: {
                    type: "template",
                    altText: "ご注文のピザはお決まりでしょうか？ マルゲリータ、マリナーラからお選びください。",
                    template: {
                        type: "buttons",
                        text: "ご注文のピザはお決まりでしょうか？",
                        actions: [
                            {type:"message",label:"マルゲリータ",text:"マルゲリータ"},
                            {type:"message",label:"マリナーラ",text:"マリナーラ"}
                        ]
                    }
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (!error){
                        bot.queue({
                            type: "text",
                            text: `${value}ですね。ありがとうございます。`
                        });
                    } else {
                        bot.change_message_to_confirm("pizza", {
                            type: "text",
                            text: "恐れ入りますが当店ではマルゲリータかマリナーラしかございません。どちらになさいますか？"
                        });
                    }
                    return resolve();
                }
            },
            size: {
                message_to_confirm: {
                    type: "template",
                    altText: "サイズはいかがいたしましょうか？ S、M、Lからお選びください。",
                    template: {
                        type: "buttons",
                        text: "サイズはいかがいたしましょうか？",
                        actions: [
                            {type:"message",label:"S",text:"S"},
                            {type:"message",label:"M",text:"M"},
                            {type:"message",label:"L",text:"L"}
                        ]
                    }
                }
            },
            address: {
                message_to_confirm: {
                    type: "text",
                    text: "お届け先の住所を教えていただけますか？"
                }
            },
            name: {
                message_to_confirm: {
                    type: "text",
                    text: "最後に、お客様のお名前を教えていただけますか？"
                }
            }
        }

        this.clear_context_on_finish = true;
    }

    parse_pizza(value, bot, event, context, resolve, reject){
        let parsed_value;
        if (value.match(/マルゲリータ/)){
            parsed_value = "マルゲリータ";
        } else if (value.match(/マリナーラ/)){
            parsed_value = "マリナーラ";
        } else {
            return reject();
        }
        return resolve(parsed_value);
    }

    parse_size(value, bot, event, context, resolve, reject){
        let parsed_value;
        if (value.match(/[sS]/) || value.match(/小/)){
            parsed_value = "S";
        } else if (value.match(/[mM]/) || value.match(/中/) || value.match(/普通/)){
            parsed_value = "M";
        } else if (value.match(/[lL]/) || value.match(/大/)){
            parsed_value = "L";
        } else {
            return reject();
        }
        return resolve(parsed_value);
    }

    parse_address(value, bot, event, context, resolve, reject){
        let parsed_value;
        if (typeof value == "string"){
            parsed_value = {
                address: value.replace("です", "").replace("でーす", "").replace("ですー", "").replace("。", ""),
                latitude: null,
                longitude: null
            }
        } else if (typeof value == "object"){
            if (value.address){
                // This is LINE location message.
                parsed_value = {
                    address: value.address,
                    latitude: value.latitude,
                    longitude: value.longitude
                }
            } else if (value.attachments){
                for (let attachment of value.attachments){
                    if (attachment.type == "location"){
                        parsed_value = {
                            address: null, // Need to fill out some day...
                            latitude: attachment.payload.coordinates.lat,
                            longitude: attachment.payload.coordinates.long
                        }
                    }
                }
            } else {
                return reject();
            }
        } else {
            return reject();
        }

        return resolve(parsed_value);
    }

    parse_name(value, bot, event, context, resolve, reject){
        let lastname, firstname, fullname;
        return mecab.parse(value).then(
            (response) => {
                for (let elem of response){
                    if (elem[3] == "人名" && elem[4] == "姓"){
                        lastname = elem[0];
                    } else if (elem[3] == "人名" && elem[4] == "名"){
                        firstname = elem[0];
                    }
                }
                fullname = "";
                if (lastname) fullname += lastname + " "; // Add trailing space. It will be removed if we don't have firstname.
                if (firstname) fullname += firstname;
                if (fullname == "") return reject();
                return resolve(fullname.trim());
            },
            (response) => {
                return reject(response);
            }
        )
    }

    // パラメーターが全部揃ったら実行する処理を記述します。
    finish(bot, event, context, resolve, reject){
        let messages = [{
            text: `${context.confirmed.name} 様、ご注文ありがとうございました！${context.confirmed.pizza}の${context.confirmed.size}サイズを30分以内にご指定の${context.confirmed.address.address}までお届けに上がります。`
        }];
        return bot.reply(messages).then(
            (response) => {
                return resolve(response);
            }
        );
    }
};
