"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_option = {
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
};

chai.use(chaiAsPromised);
const should = chai.should();

const emu = new Emulator(messenger_option.name, messenger_option.options);
const user_id = "dummy_user_id";

describe("Test sub parameter", async function(){
    beforeEach(async () => {
        await emu.clear_context(user_id);
    })

    describe("If all the sub parameters are set", async function(){
        it("save them to parent parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter"
                    }
                })
            }));

            context.intent.name.should.equal("test-sub-parameter");
            context.confirming.should.equal("juminhyo_type");
            context.to_confirm.should.deep.equal(["juminhyo_type", "whose", "quantity"]);
            context.confirmed.should.deep.equal({});
            context._sub_parameter.should.equal(true);
            context._parent_parameter.should.deep.equal({
                name: "juminhyo_list",
                type: "required_parameter",
                list: {
                    order: "new"
                }
            });

            context = await emu.send(emu.create_message_event(user_id, "住民票"));

            context.confirmed.juminhyo_type.should.equal("住民票");
            context.confirming.should.equal("whose");
            context.to_confirm.should.deep.equal(["whose", "quantity"]);

            context = await emu.send(emu.create_message_event(user_id, "個人"));

            context.confirmed.whose.should.equal("個人");
            context.confirming.should.equal("quantity");
            context.to_confirm.should.deep.equal(["quantity"]);

            context = await emu.send(emu.create_message_event(user_id, "1"));

            should.not.exist(context.confirmed.juminhyo_type);
            should.not.exist(context.confirmed.whose);
            should.not.exist(context.confirmed.quantity);
            context.confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "住民票",
                whose: "個人",
                quantity: 1
            }]);
            context.confirming.should.equal("review_juminhyo_list");
            context.to_confirm.should.deep.equal(["review_juminhyo_list"]);
            context._sub_parameter.should.equal(false);
            context._parent_parameter.should.deep.equal({});
        });
    });

    describe("If bot.apply_parameter() is called in sub parameter", async function(){
        it("save them as corresponding parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter"
                    }
                })
            }));

            context = await emu.send(emu.create_message_event(user_id, "abc"));

            context.confirming.should.equal("review_juminhyo_list");
            context.confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "abc",
                quantity: 3
            }]);
        });
    });

    describe("If user intends modifying previous parameter,", async function(){
        it("asks previously confirmed sub parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter"
                    }
                })
            }));

            context = await emu.send(emu.create_message_event(user_id, "住民票除票"));

            context.confirmed.juminhyo_type.should.equal("住民票除票");
            context.previous.confirmed.should.deep.equal(["juminhyo_type"]);
            context.previous.processed.should.deep.equal(["whose", "juminhyo_type"]);
            context.confirming.should.equal("quantity");

            context = await emu.send(emu.create_message_event(user_id, "訂正"));

            context.confirmed.juminhyo_type.should.equal("住民票除票");
            context.previous.confirmed.should.deep.equal([]);
            context.previous.processed.should.deep.equal([]);
            context.confirming.should.equal("juminhyo_type");

            context = await emu.send(emu.create_message_event(user_id, "住民票"));

            context.confirmed.juminhyo_type.should.equal("住民票");
            context.previous.confirmed.should.deep.equal(["juminhyo_type"]);
            context.previous.processed.should.deep.equal(["juminhyo_type"]);
            context.confirming.should.equal("whose");
        });
    });

    describe("If sub skill is launched in confirming sub parameter,", async function(){
        it("asks previously confirmed sub parameter.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter"
                    }
                })
            }));

            context = await emu.send(emu.create_message_event(user_id, "除票って何ですか？"));
            
            context.previous.message[0].message.text.should.equal(`除票は住民票から除外されたことを証明する書類です。`)
            context.confirming.should.equal("juminhyo_type");
            context.to_confirm.should.deep.equal(["juminhyo_type", "whose", "quantity"]);
            context.confirmed.should.deep.equal({});
            context._sub_parameter.should.equal(true);
            context._sub_skill.should.equal(false);
            context._parent_parameter.should.deep.equal({
                name: "juminhyo_list",
                type: "required_parameter",
                list: {
                    order: "new"
                }
            });
        });
    });

    describe("If skill is launched by intent postback with parameters,", async function(){
        it("set them.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter",
                        parameters: {
                            juminhyo_type: "住民票",
                            whose: "個人",
                            quantity: 2
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-sub-parameter");

            should.not.exist(context.confirmed.juminhyo_type);
            should.not.exist(context.confirmed.whose);
            should.not.exist(context.confirmed.quantity);
            context.confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "住民票",
                whose: "個人",
                quantity: 2
            }]);
            context.confirming.should.equal("review_juminhyo_list");
            context.to_confirm.should.deep.equal(["review_juminhyo_list"]);
            context._sub_parameter.should.equal(false);
            context._parent_parameter.should.deep.equal({});
        });
    });

    describe("If skill is launched by intent postback with multi-set of parameters,", async function(){
        it("set them all.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter",
                        parameters: {
                            juminhyo_type: ["住民票", "住民票"],
                            whose: ["個人", "世帯全員"],
                            quantity: [2, 1]
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-sub-parameter");

            should.not.exist(context.confirmed.juminhyo_type);
            should.not.exist(context.confirmed.whose);
            should.not.exist(context.confirmed.quantity);
            context.confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "住民票",
                whose: "世帯全員",
                quantity: 1
            },{
                juminhyo_type: "住民票",
                whose: "個人",
                quantity: 2
            }]);
            context.confirming.should.equal("review_juminhyo_list");
            context.to_confirm.should.deep.equal(["review_juminhyo_list"]);
            context._sub_parameter.should.equal(false);
            context._parent_parameter.should.deep.equal({});
        });
    });

    describe("If skill is launched by intent postback with incomplete multi-set of parameters,", async function(){
        it("set them all and ask rest of the sub parameters.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter",
                        parameters: {
                            juminhyo_type: ["住民票", "住民票"],
                            whose: ["個人"],
                            quantity: [2]
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-sub-parameter");
            context.confirming.should.equal("whose");

            context.confirmed.juminhyo_type.should.equal("住民票");
            should.not.exist(context.confirmed.whose);
            should.not.exist(context.confirmed.quantity);
            context._parent[0].confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "住民票",
                whose: "個人",
                quantity: 2
            }]);

            context = await emu.send(emu.create_message_event(user_id, "世帯全員"));
            context = await emu.send(emu.create_message_event(user_id, "1"));

            should.not.exist(context.confirmed.juminhyo_type);
            should.not.exist(context.confirmed.whose);
            should.not.exist(context.confirmed.quantity);
            context.confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "住民票",
                whose: "世帯全員",
                quantity: 1
            },{
                juminhyo_type: "住民票",
                whose: "個人",
                quantity: 2
            }]);
            context.confirming.should.equal("review_juminhyo_list");
        });
    });

    describe("If skill is launched by intent postback with incomplete multi-set of parameters,", async function(){
        it("set 1 set and goes to next param since required first sub parameter is not included in input.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter",
                        parameters: {
                            juminhyo_type: ["住民票"],
                            whose: ["個人", "世帯全員"],
                            quantity: [2, 1]
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-sub-parameter");
            context.confirming.should.equal("review_juminhyo_list");

            context.confirmed.juminhyo_list.should.deep.equal([{
                juminhyo_type: "住民票",
                whose: "個人",
                quantity: 2
            }]);
        });
    });

    describe("If skill is launched by intent postback with parameters to be save in heard,", async function(){
        it("will be saved.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter",
                        parameters: {
                            delivery: "onsite"
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-sub-parameter");
            context.confirming.should.equal('juminhyo_type')
            context = await emu.send(emu.create_message_event(user_id, "住民票"));

            context.confirming.should.equal('whose')
            context = await emu.send(emu.create_message_event(user_id, "世帯全員"));

            context.confirming.should.equal('quantity')
            context = await emu.send(emu.create_message_event(user_id, "2"));

            context.confirming.should.equal("review_juminhyo_list");
            context.heard.should.deep.equal({
                delivery: "onsite"
            })
        });
    });

    describe("If begin() contains bot.queue(),", async function(){
        it("will be sent out in first sub_parameter and removed.", async function(){
            let context = await emu.send(emu.create_postback_event(user_id, {
                data: JSON.stringify({
                    type: "intent",
                    language: "ja",
                    intent: {
                        name: "test-sub-parameter",
                        parameters: {
                            delivery: "onsite"
                        }
                    }
                })
            }));

            context.intent.name.should.equal("test-sub-parameter");
            context.confirming.should.equal('juminhyo_type')
            context.previous.message[1].message.text.should.equal("では住民票の申請を開始します。")
            context._message_queue.should.have.lengthOf(0)
            context._parent[0]._message_queue.should.have.lengthOf(0)
            context = await emu.send(emu.create_message_event(user_id, "住民票"))

            context.confirming.should.equal('whose')
            context = await emu.send(emu.create_message_event(user_id, "個人"))

            context.confirming.should.equal('quantity')
            context = await emu.send(emu.create_message_event(user_id, "1"))

            context.confirming.should.equal('review_juminhyo_list')
            context.previous.message[0].message.text.should.equal("以上でよろしいですか？")
            context.previous.message[1].message.text.should.equal("1")
            context._message_queue.should.have.lengthOf(0)
        });
    });
});

