'use strict';

require('dotenv').config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const MessengerLine = require('../module/messenger/line');
const http = require('http');

chai.use(chaiAsPromised);
const should = chai.should();

const server = http.createServer((req, res) => {
	// Reproduction ECONNRESET
	res.socket.end();
});

const port = 3000;

server.listen(port, () => {
	console.log(`Server running at http://localhost:${port}/`);
});

describe('Test for retry with ECONNRESET', async function () {
	it('will retry 3 times with ECONNRESET error.', async function () {
		const line = new MessengerLine({
			channel_id: 'dummy',
			channel_secret: 'dummy',
			channel_access_token: 'dummy',
			endpoint: `http://localhost:${port}`,
		});
		try {
			const ret = await line.request({
				method: 'post',
				url: `http://localhost:${port}/v2/bot/message/multicast`,
				headers: '',
				data: 'test',
			});
			console.log(ret);
		} catch (e) {
			console.log(e);
		}
	});
});
