const Frame = require('./Frame');
const PauseUi = require('../interface/uis/PauseUi');

class GameMenu extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.pauseUi = new PauseUi();
		this.pauseUi.bubble('resume', this);
	}

	update() {
		this.pauseUi.update(this.controller);
	}

	paint() {
		this.pauseUi.paint(this.painterSet.uiPainter);
	}
}

module.exports = GameMenu;
