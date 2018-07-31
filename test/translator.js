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

    describe("Test translator from " + emu.messenger_type, function(){
        let user_id = "translator";

        describe("Japanese", function(){
            it("will be detected as Japanese.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "ピザを注文したいのですが")
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("handle-pizza-order");
                    context.sender_language.should.equal("ja");
                });
            });
        });
    });
}
