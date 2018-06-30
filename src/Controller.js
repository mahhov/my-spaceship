class Controller {
    constructor() {
        this.UP = 0;
        this.DOWN = 1;
        this.PRESSED = 2;
        this.RELEASED = 3;

        this.keys = {};

        document.addEventListener('keydown', event =>
            !event.repeat && this.handleKeyPress(event.key));

        document.addEventListener('keyup', event =>
            this.handleKeyRelease(event.key));
    }

    handleKeyPress(key) {
        this.keys[key] = this.PRESSED;
    }

    handleKeyRelease(key) {
        this.keys[key] = this.RELEASED;
    }

    getKey(key) {
        return this.keys[key] || this.UP;
    }

    expire() {
        Object.entries(this.keys)
            .forEach(([key, value]) =>
                this.keys[key] = this.expireKey(value));
    }

    expireKey(key) {
        switch (key) {
            case this.RELEASED:
                return this.UP;
            case this.PRESSED:
                return this.DOWN;
            default:
                return key;
        }
    }
}

module.exports = Controller;

// todo on lose focus, lift all keypresses
