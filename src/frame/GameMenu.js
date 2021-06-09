import HubUi from '../interface/uis/HubUi.js';
import PauseUi from '../interface/uis/PauseUi.js';
import Frame from './Frame.js';

class GameMenu extends Frame {
	constructor(controller, painterSet, playerData) {
		super(controller, painterSet);

		this.pauseUi = new PauseUi();
		this.pauseUi.bubble('resume', this);
		this.pauseUi.on('abandon-encounter', () => this.currentUi = this.hubUi);

		this.hubUi = new HubUi(playerData);
		this.hubUi.bubble('begin-encounter', this);

		this.currentUi = this.hubUi;
	}

	pause() {
		this.currentUi = this.pauseUi;
	}

	update() {
		this.currentUi.update(this.controller);
	}

	paint() {
		this.currentUi.paint(this.painterSet.uiPainter);
	}
}

export default GameMenu;
