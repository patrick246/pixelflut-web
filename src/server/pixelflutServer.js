const net = require('net');

class PixelflutServer {
	constructor() {
		this.pixelData = Buffer.alloc(800*600*3);
	}

	listen(port = 1337) {
		net.createServer(socket => {
			let buffer = '';
			socket.on('data', data => {
				buffer += data;
				buffer = this.parseCommands(buffer, socket);
			})
		}).listen(port);
	}

	getData() {
		return this.pixelData;
	}

	parseCommands(buffer, socket) {
		const commands = buffer.split('\n');
		if(commands.length < 2) {
			return commands.pop();
		}

		let updateBatch = [];

		for(let i = 0; i < commands.length - 1; i++) {
			let cmd = commands[i];
			if(cmd.startsWith('PX ')) {
				let [, x, y, color=undefined] = cmd.split(' ');
				x = parseInt(x);
				y = parseInt(y);
				if(color === undefined) {
					socket.write('unsupported\n');
				} else if(color.length === 6 || color.length === 8) {
					updateBatch.push([x, y, color.substr(0, 6)]);
				}
			} else if(cmd.startsWith('SIZE')) {
				socket.write('SIZE 800 600\n');
			}
		}
		this.setPixels(updateBatch);
		return commands.pop();
	}

	setPixel(x, y, color) {
		if(x >= 0 && x < 800 && y >= 0 && y < 600) {
			let c = decodeColorString(color);
			this.pixelData[3 * (y * 800 + x)] = (c >> 16) & 0xFF;
			this.pixelData[3 * (y * 800 + x) + 1] = (c >> 8) & 0xFF;
			this.pixelData[3 * (y * 800 + x) + 2] = c & 0xFF;
		}
	}

	setPixels(batch) {
		batch.forEach(b => this.setPixel(...b));
	}


}

function decodeColorString(str) {
	return parseInt(str, 16);
}

module.exports = {PixelflutServer};



