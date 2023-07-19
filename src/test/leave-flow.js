"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_options = [{
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test leave flow from " + emu.messenger_type, function(){

        describe("leave event", function(){
            it("should trigger leave skill.", function(){
                this.timeout(15000);

                return Promise.resolve().then(function(){
                    let event = {
                        "type": "leave",
                        "timestamp": Date.now(),
                        "source": {
                            "type": "group",
                            "groupId": "dummy"
                        }
                    }
                    return emu.send(event);
                }).then(function(context){
                    context._clear.should.equal(true);
                });
            });
        });
    });
}
