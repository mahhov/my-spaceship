class Node {
	constructor(value, neighbors) {
		this.value = value;
		this.neighbors = neighbors;
	}
}

class Graph {
	constructor() {
		this.nodes = [];
	}

	add(value, neighbors = []) {
		let node = new Node(value, neighbors);
		this.nodes.push(node);
		return node;
	}

	addEdge(node1, node2) {
		node1.neighbors.push(node2);
		node2.neighbors.push(node1);
	}

	isSubsetConnected(excludedNodes) {
		let visited = [];
		let queue = [this.nodes.find(node => !excludedNodes.includes(node))];
		let node;
		while (node = queue.pop()) {
			if (excludedNodes.includes(node) || visited.includes(node))
				continue;
			visited.push(node);
			queue = queue.concat(node.neighbors);
		}
		return visited.length === this.nodes.length - excludedNodes.length;
	}

	get values() {
		return this.nodes.map(node => node.value);
	}

	forEach(handler) {
		this.nodes.forEach(node => handler(node.value, node));
	}
}

export default Graph;
