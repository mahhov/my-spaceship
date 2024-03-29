import Controller from '../control/Controller.js';
import Rect from '../painter/elements/Rect.js';
import Text from '../painter/elements/Text.js';
import PainterCompositor from '../painter/PainterCompositor.js';
import {Positions} from '../util/constants.js';
import Coordinate from '../util/Coordinate.js';
import FpsTracker from '../util/FpsTracker.js';

class Looper {
	static sleep(milli = 0) {
		return new Promise(resolve => setTimeout(resolve, milli));
	}

	constructor(canvas) {
		this.canvas = canvas;
		this.controller = new Controller(canvas);
		this.painterSet = new PainterCompositor(canvas);
		this.updateFpsTracker = new FpsTracker();
		this.paintFpsTracker = new FpsTracker();
		this.updateLoop();
		this.paintLoop();
	}

	setFrameClass(FrameClass) {
		this.frame = new FrameClass(this.controller, this.painterSet);
	}

	async updateLoop() {
		const iterPeriod = 1000 / 60;
		let lastIter;
		while (true) {
			if (this.frame) {
				while (performance.now() - lastIter < iterPeriod)
					await Looper.sleep();
				this.updateFpsTracker.tick();
				lastIter = performance.now();
				this.frame.update();
				this.controller.expire();
			}
			await Looper.sleep(0);
		}
	}

	async paintLoop() {
		if (this.frame) {
			this.paintFpsTracker.tick();
			this.painterSet.clear();
			this.frame.paint();

			// add fps
			this.painterSet.uiPainter.add(new Text(
				new Coordinate(1 - Positions.MARGIN, Positions.MARGIN)
					.align(Coordinate.Aligns.END, Coordinate.Aligns.START),
				`fps: ${this.paintFpsTracker.getFps()} / ${this.updateFpsTracker.getFps()}`));

			// add cursor
			let mouse = this.controller.getRawMouse();
			let mouseCoordinate = new Coordinate(mouse.x, mouse.y, .008).align(Coordinate.Aligns.CENTER);
			this.painterSet.uiPainter.add(new Rect(mouseCoordinate).setOptions({color: '#fff', thickness: 2}));
			this.painterSet.uiPainter.add(new Rect(mouseCoordinate.clone.size(.006)).setOptions({color: '#000', thickness: 2}));

			this.painterSet.paint();
		}
		requestAnimationFrame(() => this.paintLoop());
	}
}

export default Looper;
