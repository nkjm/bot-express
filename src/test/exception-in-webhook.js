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
},{
    name: "facebook",
    options: {
        facebook_app_secret: process.env.FACEBOOK_APP_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();

describe("Test exception in webhook", function(){
    let user_id = "exception-in-webhook";

    describe("Unsupported messenger", function(){
        let emu = new Emulator("unsupported");

        it("should be skipped", function(){
            return emu.clear_context(user_id).then(function(){
                let event = emu.create_unsupported_event(user_id);
                return emu.send(event);
            }).then(function(context){
                context.should.equal("OK");
            });
        });
    });
});
