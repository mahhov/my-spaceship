import UiButton from '../interface/components/UiButton.js';
import Frame from './Frame.js';

class InterfaceDemo extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);

		this.interface = new UiButton(.25, .25, .2, .04, 'x');
	}

	update() {
		this.interface.update(this.controller);
	}

	paint() {
		this.interface.paint(this.painterSet.uiPainter);
	}
}

export default InterfaceDemo;
