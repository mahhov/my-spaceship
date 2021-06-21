import HubUi from '../interface/uis/HubUi.js';
import PauseUi from '../interface/uis/PauseUi.js';
import Frame from './Frame.js';

class GameMenu extends Frame {
	constructor(controller, painterSet, playerData) {
		super(controller, painterSet);

		this.pauseUi = new PauseUi();
		this.bubble(this.pauseUi, 'resume');
		this.pauseUi.on('end-encounter', () => this.currentUi = hubUi);

		let hubUi = new HubUi(playerData);
		this.bubble(hubUi, 'begin-encounter');

		this.currentUi = hubUi;
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
