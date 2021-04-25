import {Positions} from '../util/Constants.js';
import {round} from '../util/Number.js';
import Text from '../painter/elements/Text.js';

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

export default MapGenerator;
