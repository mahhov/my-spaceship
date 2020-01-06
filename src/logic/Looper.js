const Controller = require('../control/Controller');
const PainterCompositor = require('../painter/PainterCompositor');
const FpsTracker = require('../util/FpsTracker');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

class Looper {
	static sleep(milli) {
		return new Promise(resolve => setTimeout(resolve, milli))
	}

	constructor(canvas) {
		this.canvas = canvas;
		this.controller = new Controller(canvas);
		this.painterSet = new PainterCompositor(canvas);
		this.fpsTracker = new FpsTracker();
		this.loop();
	}

	setLogicClass(LogicClass) {
		this.logic = new LogicClass(this.controller, this.painterSet);
	}

	async loop() {
		while (true) {
			await Looper.sleep(10);
			if (!this.logic)
				continue;
			this.painterSet.clear();
			this.logic.iterate();
			this.painterSet.uiPainter.add(new Text(1 - Positions.MARGIN, Positions.MARGIN, `fps: ${this.fpsTracker.getFps()}`, {align: 'right'}));
			this.painterSet.paint();
			this.controller.expire();
		}
	}
}

module.exports = Looper;
