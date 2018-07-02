const Item = require('./Item');

class LinkedList {
    add(value) {
        return !this.head
            ? this.tail = this.head = new Item(value)
            : this.tail = this.tail.next = new Item(value, this.tail);
    }

    forEach(handler) {
        let iter = this.head;
        do
            handler(iter.value);
        while (iter = iter.next) ;
    }
}

module.exports = LinkedList;
