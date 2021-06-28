class Node {
	constructor(value, prev) {
		this.value = value;
		this.prev = prev;
	}
}

class LinkedList {
	constructor() {
		this.length = 0;
	}

	add(value) {
		this.length++;
		return !this.head
			? this.tail = this.head = new Node(value)
			: this.tail = this.tail.next = new Node(value, this.tail);
	}

	remove(node) {
		this.length--;
		if (node.prev)
			node.prev.next = node.next;
		if (node.next)
			node.next.prev = node.prev;
		if (this.head === node)
			this.head = node.next;
		if (this.tail === node)
			this.tail = node.prev;
	}

	forEach(handler) {
		let iter = this.head;
		while (iter) {
			handler(iter.value, iter);
			iter = iter.next;
		}
	}

	filter(handler) {
		let output = [];
		let iter = this.head;
		while (iter) {
			if (handler(iter.value, iter))
				output.push(iter);
			iter = iter.next;
		}
		return output;
	}

	find(handler) {
		let iter = this.head;
		while (iter) {
			if (handler(iter.value, iter))
				return iter;
			iter = iter.next;
		}
	}

	[Symbol.iterator]() {
		let iter = this.head;
		return {
			next: () => {
				if (!iter)
					return {done: true};
				let value = iter.value;
				iter = iter.next;
				return {value, done: false};
			},
		};
	}
}

export default LinkedList;
