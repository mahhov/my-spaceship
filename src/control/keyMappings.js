import State from './State.js';

class KeyMapping {
	constructor(keys = [], mouse = [], string = [keys[0]]) {
		this.keys = keys;
		this.mouse = mouse;
		this.string = string;
	}

	getState(controller) {
		return State.merge(
			...this.keys.map(key => controller.getKeyState(key)),
			...this.mouse.map(mouse => controller.getMouseState(mouse)));
	}

	static get keyMappings() {
		if (!this.keyMappings_) {
			this.keyMappings_ = {
				moveLeft: new KeyMapping(['a']),
				moveUp: new KeyMapping(['w']),
				moveRight: new KeyMapping(['d']),
				moveDown: new KeyMapping(['s']),
				ability1: new KeyMapping([' '], [0], ['space', 'mb left']),
				ability2: new KeyMapping(['shift'], [2], ['shift', 'mb right']),
				ability3: new KeyMapping(['q']),
				ability4: new KeyMapping(['e']),
				ability5: new KeyMapping(['r']),
				ability6: new KeyMapping(['t']),
				ability7: new KeyMapping(['f']),
				targetLock: new KeyMapping(['capslock']),
				zoomIn: new KeyMapping(['x']),
				zoomOut: new KeyMapping(['z']),
				minimapZoom: new KeyMapping(['tab']), // todo [medium] prevent tab from scrolling focus
				pause: new KeyMapping(['p']),
			}

			this.keyMappings_.ABILITY_I = [
				this.keyMappings_.ability1,
				this.keyMappings_.ability2,
				this.keyMappings_.ability3,
				this.keyMappings_.ability4,
				this.keyMappings_.ability5,
				this.keyMappings_.ability6,
				this.keyMappings_.ability7,
			];
		}

		return this.keyMappings_;
	}
}

export default KeyMapping.keyMappings;
