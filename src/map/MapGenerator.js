const {Positions} = require('../util/Constants');
const {round} = require('../util/Number');
const Text = require('../painter/Text');

class MapGenerator {
	constructor(map) {
		this.map = map;
		this.timer = 0;
		// must create player
	}

	update() {
		this.timer++;
	}

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2,
			`${round(this.timer / 100)}`, font));
	}
}

module.exports = MapGenerator;
