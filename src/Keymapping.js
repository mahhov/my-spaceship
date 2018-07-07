const makeEnum = require('./util/Enum');

const Keys = makeEnum(
	'MOVE_LEFT',
	'MOVE_UP',
	'MOVE_RIGHT',
	'MOVE_DOWN',
	'ABILITY_1',
	'ABILITY_2',
	'ABILITY_3',
	'ABILITY_4',
	'ABILITY_5',
	'ABILITY_6',
	'ABILITY_7');

Keys.ABILITY_I = [
	Keys.ABILITY_1,
	Keys.ABILITY_2,
	Keys.ABILITY_3,
	Keys.ABILITY_4,
	Keys.ABILITY_5,
	Keys.ABILITY_6,
	Keys.ABILITY_7];

class Keymapping {
	constructor() {
		this.map = {};

		this.map[Keys.MOVE_LEFT] = 'a';
		this.map[Keys.MOVE_UP] = 'w';
		this.map[Keys.MOVE_RIGHT] = 'd';
		this.map[Keys.MOVE_DOWN] = 's';
		this.map[Keys.ABILITY_1] = 'q';
		this.map[Keys.ABILITY_2] = 'e';
		this.map[Keys.ABILITY_3] = '1';
		this.map[Keys.ABILITY_4] = '2';
		this.map[Keys.ABILITY_5] = '3';
		this.map[Keys.ABILITY_6] = '4';
		this.map[Keys.ABILITY_7] = '5';
	}

	getKey(control) {
		return this.map[control];
	}

	isActive(controller, control) {
		let state = controller.getKeyState(this.getKey(control));
		return state === controller.PRESSED || state === controller.DOWN;
	}
}

module.exports = {Keymapping, Keys};
