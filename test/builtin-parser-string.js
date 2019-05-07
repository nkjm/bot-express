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
const emu = new Emulator(messenger_option.name, messenger_option.options);

chai.use(chaiAsPromised);
const should = chai.should();
const user_id = "dummy_user_id";

describe("Test builtin string parser", async function(){

    describe("katakana for katakana", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("katakana");

            context = await emu.send(emu.create_message_event(user_id, "マルゲリータ"));

            // Test
            context.confirmed.katakana.should.equal("マルゲリータ");
        });
    });

    describe("hiragana for katakana", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("katakana");

            context = await emu.send(emu.create_message_event(user_id, "まるげりーた"));

            // Test
            context.confirmed.katakana.should.equal("マルゲリータ");
        });
    });

    describe("kanji for katakana", async function(){
        it("will be rejected.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string"
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("katakana");

            context = await emu.send(emu.create_message_event(user_id, "丸"));

            // Test
            should.not.exist(context.confirmed.katakana);
        });
    });

    describe("katakana for hiragana", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("hiragana");

            context = await emu.send(emu.create_message_event(user_id, "マルゲリータ"));

            // Test
            context.confirmed.hiragana.should.equal("まるげりいた");
        });
    });

    describe("hiragana for hiragana", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("hiragana");

            context = await emu.send(emu.create_message_event(user_id, "まるげりいた"));

            // Test
            context.confirmed.hiragana.should.equal("まるげりいた");
        });
    });

    describe("kanji for hiragana", async function(){
        it("will be rejected.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("hiragana");

            context = await emu.send(emu.create_message_event(user_id, "丸"));

            // Test
            should.not.exist(context.confirmed.hiragana);
        });
    });

    describe("Value less than min length", async function(){
        it("will be rejected.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ",
                        hiragana: "まるげりいた"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("minmax");

            context = await emu.send(emu.create_message_event(user_id, "マル"));

            // Test
            should.not.exist(context.confirmed.minmax);
        });
    });

    describe("Value more than max length", async function(){
        it("will be rejected.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ",
                        hiragana: "まるげりいた"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("minmax");

            context = await emu.send(emu.create_message_event(user_id, "マルゲリータ"));

            // Test
            should.not.exist(context.confirmed.minmax);
        });
    });

    describe("Value of correct length", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ",
                        hiragana: "まるげりいた"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("minmax");

            context = await emu.send(emu.create_message_event(user_id, "マルゲ"));

            // Test
            context.confirmed.minmax.should.equal("マルゲ");
        });
    });

    describe("Value matches regex", async function(){
        it("will be accepted.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ",
                        hiragana: "まるげりいた",
                        minmax: "マルゲ"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("regex");

            context = await emu.send(emu.create_message_event(user_id, "ab"));

            // Test
            should.not.exist(context.confirmed.regex);

            context = await emu.send(emu.create_message_event(user_id, "abcd"));

            // Test
            should.not.exist(context.confirmed.regex);

            context = await emu.send(emu.create_message_event(user_id, "abd"));

            // Test
            should.not.exist(context.confirmed.regex);

            context = await emu.send(emu.create_message_event(user_id, "abb"));

            context.confirmed.regex.should.equal("abb");
        });
    });

    describe("No policy", async function(){
        it("will be accept as long as value is string.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ",
                        hiragana: "まるげりいた",
                        minmax: "マルゲ",
                        regex: "abb"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("no_policy");

            context = await emu.send(emu.create_postback_event(user_id, {data: 1}));

            // Test
            context.confirming.should.equal("no_policy");

            context = await emu.send(emu.create_message_event(user_id, "マルゲリータ"));

            // Test
            context.confirmed.no_policy.should.equal("マルゲリータ");
        });
    });

    describe("Exclude", async function(){
        it("accepts the value as long as it is not included by exclude.", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ",
                        hiragana: "まるげりいた",
                        minmax: "マルゲ",
                        regex: "abb",
                        no_policy: "マルゲリータ"
                    }
                }
            })});
            let context = await emu.send(event);

            // Test
            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("exclude");

            context = await emu.send(emu.create_message_event(user_id, "hoge"));

            // Test
            context.confirming.should.equal("exclude");

            context = await emu.send(emu.create_message_event(user_id, "マルゲリータ"));

            context.confirmed.exclude.should.equal("マルゲリータ");
        });
    });

    describe("If sanitize is true", async function(){
        it("strips tags and scripts", async function(){
            this.timeout(15000);

            await emu.clear_context(user_id);
            
            let event = emu.create_postback_event(user_id, {data: JSON.stringify({
                _type: "intent",
                language: "ja",
                intent: {
                    name: "test-builtin-parser-string",
                    parameters: {
                        katakana: "マルゲリータ",
                        hiragana: "まるげりいた",
                        minmax: "マルゲ",
                        regex: "abb",
                        no_policy: "マルゲリータ",
                        exclude: "マルゲリータ"
                    }
                }
            })});
            let context = await emu.send(event);

            context.intent.name.should.equal("test-builtin-parser-string");
            context.confirming.should.equal("sanitize");

            context = await emu.send(emu.create_message_event(user_id, "<script>alert('abc')</script>マルゲリータ"));

            context.confirmed.sanitize.should.equal("マルゲリータ");
        });
    });

});
