'use strict';

require('dotenv').config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const MessengerLine = require('../module/messenger/line');
const express = require('express');
const bodyParser = require('body-parser');

const server = express();
server.use(bodyParser.json());

const port = 3000;

chai.use(chaiAsPromised);
const should = chai.should();

server.post('/v2/bot/message/multicast', (req, res) => {
    // Reproduction ECONNRESET
    res.socket.end();
});

server.post('/v2/bot/message/reply', (req, res) => {
    res.status(400).json({
        message: "The request body has 2 error(s)",
        details: [
            {
                message: "May not be empty",
                property: "test",
            },
            {
                message: "You have reached your monthly limit.",
                property: "test",
            }
        ]
    });
});

server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});

describe('Test for retry with ECONNRESET', async function () {
	it('will not retry with reached monthy limit error.', async function () {
		const line = new MessengerLine({
			channel_id: 'dummy',
			channel_secret: 'dummy',
			channel_access_token: 'dummy',
			endpoint: `http://localhost:${port}`,
		});
        let headers = {
            Authorization: `Bearer test`,
            'X-Line-Retry-Key': line.generate_retry_key(),
        }
        try {
			const ret = await line.request({
				method: 'post',
				url: `http://localhost:${port}/v2/bot/message/reply`,
				headers: headers,
				data: 'test',
			});
			console.log(ret);
		} catch (e) {
            console.log(e.toString());
            e.toString().should.includes("BotExpressMessengerLineError");
        }
	});
    it('will retry 3 times with ECONNRESET error.', async function () {
		const line = new MessengerLine({
			channel_id: 'dummy',
			channel_secret: 'dummy',
			channel_access_token: 'dummy',
			endpoint: `http://localhost:${port}`,
		});
		try {
            let headers = {
                Authorization: `Bearer test`,
                'X-Line-Retry-Key': line.generate_retry_key(),
            }
            const ret = await line.request({
				method: 'post',
				url: `http://localhost:${port}/v2/bot/message/multicast`,
				headers: headers,
				data: 'test',
			});
			console.log(ret);
		} catch (e) {
            console.log(e.toString());
            e.toString().should.includes("BotExpressMessengerLineError");
        }
	});
});
