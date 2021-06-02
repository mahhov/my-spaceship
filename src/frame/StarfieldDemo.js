import Camera from '../camera/Camera.js';
import Text from '../painter/elements/Text.js';
import Starfield from '../starfield/Starfield.js';
import StarfieldNoise from '../starfield/StarfieldNoise.js';
import Color from '../util/Color.js';
import Coordinate from '../util/Coordinate.js';
import Frame from './Frame.js';

class StarfieldDemo extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.camera = new Camera(0, 0, 1);
	}

	update() {
		this.periodicallySwapStarfield();
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x - .5, y: y - .5}, {x, y});
	}

	paint() {
		this.starfield.paint(this.painterSet.uiPainter, this.camera);
		this.painterSet.uiPainter.add(new Text(new Coordinate(.05, .05).align(Coordinate.Aligns.CENTER), this.noise ? 'noise' : 'rand', {color: Color.WHITE.get()}));
	}

	periodicallySwapStarfield() {
		if (!this.iter) {
			this.iter = 100;
			this.noise = !this.noise;
			this.starfield = this.noise ? new StarfieldNoise(1, 1) : new Starfield(1, 1);
		}
		this.iter--;
	}
}

export default StarfieldDemo;
