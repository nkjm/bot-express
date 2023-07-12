"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const should = chai.should();

chai.use(chaiAsPromised);

const key = "dummy_user_id";
const Memory = require(`../module/memory/redis`);
const memory = new Memory({
    url: process.env.REDIS_URL
})

describe(`Test memory/redis`, async function(){
    describe("Object which does not contain Buffer.", async function(){
        it("is saved.", async function(){
            await memory.put(key, {
                confirming: "hoge"
            }, 600);
            const context = await memory.get(key);
            context.confirming.should.equal("hoge");
        });
    });

    describe("Object which contains Buffer.", async function(){
        it("is saved.", async function(){
            await memory.put(key, {
                confirming: "hoge",
                picture: Buffer.from("hogehoge")
            }, 600);
            const context = await memory.get(key);
            context.confirming.should.equal("hoge");
            context.picture.should.deep.equal(Buffer.from("hogehoge"));
        });
    });
});
