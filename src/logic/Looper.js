const Controller = require('../control/Controller');
const PainterCompositor = require('../painter/PainterCompositor');
const FpsTracker = require('../util/FpsTracker');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

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

	setLogicClass(LogicClass) {
		this.logic = new LogicClass(this.controller, this.painterSet);
	}

	async updateLoop() {
		const iterPeriod = 1000 / 60;
		let lastIter;
		while (true) {
			if (this.logic) {
				while (performance.now() - lastIter < iterPeriod)
					await Looper.sleep();
				this.updateFpsTracker.tick();
				lastIter = performance.now();
				this.logic.update();
				this.controller.expire();
			}
			await Looper.sleep(10);
		}
	}

	async paintLoop() {
		if (this.logic) {
			this.paintFpsTracker.tick();
			this.painterSet.clear();
			this.logic.paint();
			this.painterSet.uiPainter.add(new Text(1 - Positions.MARGIN, Positions.MARGIN, `fps: ${this.paintFpsTracker.getFps()} / ${this.updateFpsTracker.getFps()}`, {align: 'right'}));
			this.painterSet.paint();
			await Looper.sleep(10);
		}
		requestAnimationFrame(() => this.paintLoop());
	}
}

module.exports = Looper;
