const makeEnum = require('../util/Enum');
const Controller = require('./Controller');
const State = require('./State');

const Controls = makeEnum(
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

Controls.ABILITY_I = [
	Controls.ABILITY_1,
	Controls.ABILITY_2,
	Controls.ABILITY_3,
	Controls.ABILITY_4,
	Controls.ABILITY_5,
	Controls.ABILITY_6,
	Controls.ABILITY_7];

let ControlToKeyMap = {
	[Controls.MOVE_LEFT]: ['a'],
	[Controls.MOVE_UP]: ['w'],
	[Controls.MOVE_RIGHT]: ['d'],
	[Controls.MOVE_DOWN]: ['s'],
	[Controls.ABILITY_1]: ['j', '1'],
	[Controls.ABILITY_2]: ['k', '2'],
	[Controls.ABILITY_3]: ['l', '3'],
	[Controls.ABILITY_4]: ['u', '4'],
	[Controls.ABILITY_5]: ['i', '5'],
	[Controls.ABILITY_6]: ['o', '6'],
	[Controls.ABILITY_7]: ['p', '7'],
	[Controls.TARGET_LOCK]: ['capslock'],
	[Controls.ZOOM_IN]: ['x'],
	[Controls.ZOOM_OUT]: ['z'],
	[Controls.MINIMAP_ZOOM]: ['q'],
};

class Keymapping {
	// map control (e.g. ZOOM_OUT) to keys (e.g. ['z', 'y'])
	static getKeys(control) {
		return Keymapping.ControlToKeyMap[control];
	}

	// map control (e.g. ZOOM_OUT) to state
	static getControlState(controller, control) {
		return State.merge(Keymapping.getKeys(control).map(key => controller.getKeyState(key)));
	}
}

// todo [high] rename to Controls
Keymapping.Keys = Controls;
Keymapping.ControlToKeyMap = ControlToKeyMap;

module.exports = Keymapping;
