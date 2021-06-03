import Controller from '../control/Controller.js';
import Text from '../painter/elements/Text.js';
import PainterCompositor from '../painter/PainterCompositor.js';
import {Positions} from '../util/Constants.js';
import Coordinate from '../util/Coordinate.js';
import FpsTracker from '../util/FpsTracker.js';

class Looper {
	static sleep(milli = 0) {
		return new Promise(resolve => setTimeout(resolve, milli))
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
			await Looper.sleep(10);
		}
	}

	async paintLoop() {
		if (this.frame) {
			this.paintFpsTracker.tick();
			this.painterSet.clear();
			this.frame.paint();
			this.painterSet.uiPainter.add(new Text(
				new Coordinate(1 - Positions.MARGIN, Positions.MARGIN)
					.align(Coordinate.Aligns.END, Coordinate.Aligns.START),
				`fps: ${this.paintFpsTracker.getFps()} / ${this.updateFpsTracker.getFps()}`));
			this.painterSet.paint();
			await Looper.sleep(10);
		}
		requestAnimationFrame(() => this.paintLoop());
	}
}

export default Looper;
