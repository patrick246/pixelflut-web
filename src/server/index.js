const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Png = require('pngjs').PNG;
const {PixelflutServer} = require('./pixelflutServer');

const app = express();
const httpServer = http.Server(app);
const wss = new WebSocket.Server({server: httpServer});

let pngFile = '';

const clients = [];

app.get('/img', (req, res) => {
	res.type('image/png').send(pngFile);
});

app.use(express.static('client'));

httpServer.listen(8080, () => {
	console.log('HTTP Server listening on :8080');
});

wss.on('connection', ws => {
	clients.push(ws);
	ws.on('close', () => {
		clients.splice(clients.indexOf(ws), 1);
	});
});

const pixelflut = new PixelflutServer();
pixelflut.listen();

const generatePngJob = () => {
	let png = new Png({width: 800, height: 600, inputColorType: 2, inputHasAlpha: false});
	const bufs = [];
	png.data = pixelflut.getData();
	png.pack();


	png.on('data', data => {
		bufs.push(data);
	});

	png.on('end', () => {
		let buffer = Buffer.concat(bufs);
		clients.forEach(c => {
			if(c.readyState === WebSocket.OPEN)
				c.send(buffer);
		});

		setImmediate(generatePngJob);
	});
};

setTimeout(generatePngJob, 16);