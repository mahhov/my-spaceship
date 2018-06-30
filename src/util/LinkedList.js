const Item = require('./Item');

class LinkedList {
    add(value) {
        return !this.head
            ? this.tail = this.head = new Item(value)
            : this.tail = this.tail.next = new Item(value, this.tail);
    }
}

module.exports = LinkedList;
