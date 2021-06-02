import PauseUi from '../interface/uis/PauseUi.js';
import Frame from './Frame.js';

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

export default GameMenu;
