const Ui = require('./Ui');
const UiText = require('../components/UiText');
const UiButton = require('../components/UiButton');

class PauseUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(.5, .15, 'Paused'));
		this.add(new UiButton(.42, .2, .16, .02, 'Resume', 'p'))
			.bubble('click', this, 'resume');
		this.add(new UiButton(.42, .25, .16, .02, 'Abandon Hunt'))
			.bubble('click', this, 'abandon-hunt');
	}
}

module.exports = PauseUi;
