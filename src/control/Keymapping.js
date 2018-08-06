const makeEnum = require('../util/Enum');
const Controller = require('./Controller');

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
	'ABILITY_7',
	'TARGET_LOCK',
	'ZOOM_IN',
	'ZOOM_OUT',
	'MINIMAP_ZOOM');

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
		this.map[Keys.ABILITY_1] = 'j';
		this.map[Keys.ABILITY_2] = 'k';
		this.map[Keys.ABILITY_3] = 'l';
		this.map[Keys.ABILITY_4] = 'u';
		this.map[Keys.ABILITY_5] = 'i';
		this.map[Keys.ABILITY_6] = 'o';
		this.map[Keys.ABILITY_7] = 'p';
		this.map[Keys.TARGET_LOCK] = 'capslock';
		this.map[Keys.ZOOM_IN] = 'x';
		this.map[Keys.ZOOM_OUT] = 'z';
		this.map[Keys.MINIMAP_ZOOM] = 'q';
	}

	// map control (e.g. ZOOM_OUT) to key (e.g. 'z')
	getKey(control) {
		return this.map[control];
	}

	// map control (e.g. ZOOM_OUT) to state
	getKeyState(controller, control) {
		return controller.getKeyState(this.getKey(control));
	}
}

Keymapping.Keys = Keys;

module.exports = Keymapping;
