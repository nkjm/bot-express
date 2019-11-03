"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const should = chai.should()
const Emulator = require("../test-util/emulator");
const emu = new Emulator(
    "line", 
    { line_channel_secret: process.env.LINE_CHANNEL_SECRET }, 
    process.env.TEST_USER_ID
)

describe("Test builtin string parser", async function(){
    beforeEach(async () => {
        await emu.clear_context(process.env.TEST_USER_ID)
    })

    describe("katakana for katakana", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "katakana"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("katakana")

            context = await emu.say("マルゲリータ")
            should.not.exist(context.confirming)
            context.confirmed.katakana.should.equal("マルゲリータ")
        });
    });

    describe("hiragana for katakana", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "katakana"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("katakana")

            context = await emu.say("まるげりーた");
            should.not.exist(context.confirming)
            context.confirmed.katakana.should.equal("マルゲリータ");
        });
    });

    describe("kanji for katakana", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "katakana"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("katakana")

            context = await emu.say("丸")
            context.confirming.should.equal("katakana")
            should.not.exist(context.confirmed.katakana)
        });
    });

    describe("katakana for hiragana", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "hiragana"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("hiragana")

            context = await emu.say("マルゲリータ")
            should.not.exist(context.confirming)
            context.confirmed.hiragana.should.equal("まるげりいた")
        })
    })

    describe("hiragana for hiragana", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "hiragana"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("hiragana")

            context = await emu.say("まるげりいた")
            should.not.exist(context.confirming)
            context.confirmed.hiragana.should.equal("まるげりいた")
        })
    })

    describe("kanji for hiragana", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "hiragana"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("hiragana")

            context = await emu.say("丸")
            context.confirming.should.equal("hiragana")
        })
    })

    describe("Value less than min length", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "minmax"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("minmax")

            context = await emu.say("マル");
            context.confirming.should.equal("minmax")
        })
    })

    describe("Value more than max length", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "minmax"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("minmax")

            context = await emu.say("マルゲリータ");
            context.confirming.should.equal("minmax")
        })
    })

    describe("Value of correct length", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "minmax"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("minmax")

            context = await emu.say("マルゲ");
            context.confirmed.minmax.should.equal("マルゲ");
        })
    })

    describe("Value matches regex", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "regex"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("regex");

            context = await emu.say("ab")
            should.not.exist(context.confirmed.regex);

            context = await emu.say("abcd")
            should.not.exist(context.confirmed.regex);

            context = await emu.say("abd")
            should.not.exist(context.confirmed.regex);

            context = await emu.say("abb")
            context.confirmed.regex.should.equal("abb");
        });
    });

    describe("No policy", async function(){
        it("will be accept as long as value is string.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "no_policy"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("no_policy");

            context = await emu.postback({data: 1})
            context.confirming.should.equal("no_policy");

            context = await emu.say("マルゲリータ")
            context.confirmed.no_policy.should.equal("マルゲリータ");
        });
    });

    describe("Exclude", async function(){
        it("accepts the value as long as it is not included by exclude.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "exclude"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("exclude");

            context = await emu.say("hoge")
            context.confirming.should.equal("exclude");

            context = await emu.say("マルゲリータ")
            context.confirmed.exclude.should.equal("マルゲリータ");
        })
    })

    describe("If sanitize is true", async function(){
        it("strips tags and scripts", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "sanitize"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("sanitize")

            context = await emu.say("<script>alert('abc')</script>マルゲリータ")
            context.confirmed.sanitize.should.equal("マルゲリータ")
        })
    })

    describe("zenkaku for zenkaku", async function(){
        it("will be accepted.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "zenkaku"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("zenkaku")

            context = await emu.say("マルゲリータ")
            context.confirmed.zenkaku.should.equal("マルゲリータ")
        })
    })

    describe("hankaku for zenkaku", async function(){
        it("will be rejected.", async function(){
            let context

            context = await emu.launch("test-builtin-parser-string", {
                test_case: "zenkaku"
            })
            context.intent.name.should.equal("test-builtin-parser-string")
            context.confirming.should.equal("zenkaku")

            context = await emu.say("マルゲリータ pls.")
            context.confirming.should.equal("zenkaku")
        })
    })
})
