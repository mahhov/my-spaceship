import {randInt} from './number.js';

class Rune {
	constructor(width = 4, height = 3, nodeCount = 7, minConnections = 5) {
		for (let i = 0; i < 100; i++) {
			// create nodes;
			this.nodes = [...Array(width)].map(_ => [...Array(height)]);
			for (let i = 0; i < nodeCount; i++)
				this.nodes[randInt(width)][randInt(height)] = true;

			// create connections
			this.connections = [];
			for (let x = 0; x < width; x++)
				for (let y = 0; y < height; y++) {
					if (!this.nodes[x][y])
						continue;
					if (this.nodes[x + 1]?.[y])
						this.connections.push([x, y, x + 1, y]);
					if (this.nodes[x][y + 1])
						this.connections.push([x, y, x, y + 1]);
				}

			if (this.connections.length > minConnections)
				break;
		}
	}

	paint() {

	}
}

export default Rune;
