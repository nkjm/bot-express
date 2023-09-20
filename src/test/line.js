"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const MessengerLine = require('../module/messenger/line');
const messenger_option = {
    channel_id: process.env.LINE_CHANNEL_ID,
    channel_secret: process.env.LINE_CHANNEL_SECRET
};

chai.use(chaiAsPromised);
const should = chai.should();

describe('test line', async function () {

    it('should truncate alt text on reply', async function () {
        const messenger = new MessengerLine(messenger_option)
        const messages = [
            {
                type: 'flex',
                altText: 'foo'.repeat(1000)
            },
            {
                type: 'text',
                text: 'foo'
            },
            {
                type: 'imagemap',
                altText: '👨🏻‍🦱'.repeat(1000)
            },
        ]
        for (const message of messages) {
            if ('altText' in message) {
                message.altText = messenger._truncate_alt_text(message.altText)
            }
        }
        messages[0].altText.length.should.equal(400)
        messages[0].altText.endsWith('…').should.be.true
        messages[1].text.should.equal('foo')
        messages[2].altText.length.should.equal(400)
        messages[2].altText.endsWith('…').should.be.true
    })
})
