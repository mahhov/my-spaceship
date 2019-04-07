const Item = require('./Item');

class LinkedList {
	constructor() {
		this.length = 0;
	}

	add(value) {
		this.length++;
		return !this.head
			? this.tail = this.head = new Item(value)
			: this.tail = this.tail.next = new Item(value, this.tail);
	}

	remove(item) {
		this.length--;
		if (item.prev)
			item.prev.next = item.next;
		if (item.next)
			item.next.prev = item.prev;
		if (this.head === item)
			this.head = item.next;
		if (this.tail === item)
			this.tail = item.prev;
	}

	forEach(handler) {
		let iter = this.head;
		while (iter) {
			handler(iter.value, iter);
			iter = iter.next;
		}
	}

	find(handler) {
		let iter = this.head;
		while (iter) {
			if (handler(iter.value, iter))
				return iter;
			iter = iter.next;
		}
	}
}

module.exports = LinkedList;
