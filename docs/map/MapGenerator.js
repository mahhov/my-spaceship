import Player from '../entities/heroes/Player.js';
import Text from '../painter/elements/Text.js';
import {Positions} from '../util/Constants.js';
import Coordinate from '../util/Coordinate.js';
import {round} from '../util/number.js';

class MapGenerator {
	constructor(map, playerData) {
		// todo [medium] There is a lot of shared code in the sub class constructors, including player creation. It should be extracted to here.
		this.map = map;
		this.timer = 0;
		this.player = new Player(playerData);
		// must create player
	}

	update() {
		this.timer++;
	}

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		painter.add(new Text(
			new Coordinate(1 - Positions.MARGIN, Positions.MARGIN * 2 + Positions.BAR_HEIGHT).align(Coordinate.Aligns.END, Coordinate.Aligns.START),
			`${round(this.timer / 100)}`));
	}
}

export default MapGenerator;
