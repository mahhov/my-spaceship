class Keymapping {
    constructor() {
        this.MOVE_LEFT = 0;
        this.MOVE_RIGHT = 1;
        this.MOVE_UP = 2;
        this.MOVE_DOWN = 3;

        this.map = {};

        this.map[this.MOVE_LEFT] = 'a';
        this.map[this.MOVE_RIGHT] = 'd';
        this.map[this.MOVE_UP] = 'w';
        this.map[this.MOVE_DOWN] = 's';
    }

    getKey(control) {
        return this.map[control];
    }

    isActive(controller, control) {
        return controller.getKey(this.getKey(control));
    }
}

module.exports = Keymapping;
