class Keymapping {
	constructor() {
		this.MOVE_LEFT = 0;
		this.MOVE_UP = 1;
		this.MOVE_RIGHT = 2;
		this.MOVE_DOWN = 3;
		this.ABILITY_1 = 4;
		this.ABILITY_2 = 5;
		this.ABILITY_3 = 6;
		this.ABILITY_4 = 7;
		this.ABILITY_5 = 8;
		this.ABILITY_6 = 9;
		this.ABILITY_7 = 10;

		this.map = {};

		this.map[this.MOVE_LEFT] = 'a';
		this.map[this.MOVE_UP] = 'w';
		this.map[this.MOVE_RIGHT] = 'd';
		this.map[this.MOVE_DOWN] = 's';
		this.map[this.ABILITY_1] = 'q';
		this.map[this.ABILITY_2] = 'e';
		this.map[this.ABILITY_3] = '1';
		this.map[this.ABILITY_4] = '2';
		this.map[this.ABILITY_5] = '3';
		this.map[this.ABILITY_6] = '4';
		this.map[this.ABILITY_7] = '5';
	}

	getKey(control) {
		return this.map[control];
	}

	isActive(controller, control) {
		let state = controller.getKeyState(this.getKey(control));
		return state === controller.PRESSED || state === controller.DOWN;
	}
}

module.exports = Keymapping;
