const Logic = require('./Logic');
const Button = require('../interface/Button');

class GameMenu extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);

		this.resumeButton = new Button('Resume');
		this.resumeButton.setPosition(.45, .45, .1, .1);
		this.resumeButton.bubble('click', this, 'resume');
	}

	update() {
		this.resumeButton.update(this.controller);
	}

	paint() {
		this.resumeButton.paint(this.painterSet.painter);
	}
}

module.exports = GameMenu;
