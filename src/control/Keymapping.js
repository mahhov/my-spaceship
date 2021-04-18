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
	'MINIMAP_ZOOM',
	'PAUSE');

Controls.ABILITY_I = [
	Controls.ABILITY_1,
	Controls.ABILITY_2,
	Controls.ABILITY_3,
	Controls.ABILITY_4,
	Controls.ABILITY_5,
	Controls.ABILITY_6,
	Controls.ABILITY_7];

let controlMap = {
	[Controls.MOVE_LEFT]: {keys: ['a'], mouse: []},
	[Controls.MOVE_UP]: {keys: ['w'], mouse: []},
	[Controls.MOVE_RIGHT]: {keys: ['d'], mouse: []},
	[Controls.MOVE_DOWN]: {keys: ['s'], mouse: []},
	[Controls.ABILITY_1]: {keys: [' '], mouse: [0], string: ['space', 'mb left']},
	[Controls.ABILITY_2]: {keys: ['shift'], mouse: [2], string: ['shift', 'mb right']},
	[Controls.ABILITY_3]: {keys: ['q'], mouse: []},
	[Controls.ABILITY_4]: {keys: ['e'], mouse: []},
	[Controls.ABILITY_5]: {keys: ['r'], mouse: []},
	[Controls.ABILITY_6]: {keys: ['t'], mouse: []},
	[Controls.ABILITY_7]: {keys: ['f'], mouse: []},
	[Controls.TARGET_LOCK]: {keys: ['capslock'], mouse: []},
	[Controls.ZOOM_IN]: {keys: ['x'], mouse: []},
	[Controls.ZOOM_OUT]: {keys: ['z'], mouse: []},
	[Controls.MINIMAP_ZOOM]: {keys: ['tab'], mouse: []}, // todo [medium] prevent tab from scrolling focus
	[Controls.PAUSE]: {keys: ['p'], mouse: []},
};

class Keymapping {
	// map control (e.g. ZOOM_OUT) to keys (e.g. ['z', 'y'])
	static getString(control) {
		return controlMap[control].string || [controlMap[control].keys[0]];
	}

	// todo [low] replace this roundabout getControlState() with a controlToStateMap.
	// map control (e.g. ZOOM_OUT) to state
	static getControlState(controller, control) {
		return State.merge(
			...controlMap[control].keys.map(key => controller.getKeyState(key)),
			...controlMap[control].mouse.map(mouse => controller.getMouseState(mouse)));
	}
}

Keymapping.Controls = Controls;

module.exports = Keymapping;
