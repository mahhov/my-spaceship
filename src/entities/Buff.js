import Rect from '../painter/elements/Rect.js';
import Text from '../painter/elements/Text.js';
import {Positions} from '../util/Constants.js';
import Coordinate from '../util/Coordinate.js';
import Pool from '../util/Pool.js';

class Buff {
	constructor(duration, uiColor, uiText, visible = true) {
		// duration param of 0 will be infinite, 1 will be active for 1 tick
		this.durationUnlimited = !duration;
		this.duration = new Pool(duration + 1, -1);
		this.uiColor = uiColor;
		this.uiText = uiText;
		this.visible = visible;
		this.effects = {};
	}

	static sum(buffs, statId) {
		return buffs
			.map(buff => buff.effects[statId] || 0)
			.reduce((a, b) => a + b, 0);
	}

	addEffect(statId, value) {
		this.effects[statId] ||= 0;
		this.effects[statId] += value;
		// todo [medium] return this
	}

	// return true if expired. Leaving duration undefined or 0 will never expire.
	tick() {
		return this.expired || !this.durationUnlimited && this.duration.increment();
	}

	reset() {
		this.expired = false;
		this.duration.restore();
	}

	expire() {
		this.duration.value = 0;
		this.expired = true;
	}

	paintUi(painter, uiIndex) {
		let left = 1 - (uiIndex + 1) * (Positions.BUFF_SIZE + Positions.MARGIN);
		let top = 1 - Positions.MARGIN * 3 - Positions.BAR_HEIGHT * 2 - Positions.BUFF_SIZE;
		let size = Positions.BUFF_SIZE;

		// background
		painter.add(new Rect(new Coordinate(left, top, size))
			.setOptions({fill: true, color: this.uiColor.getShade()}));

		// foreground for current charges
		let fillHeight = size * this.duration.getRatio();
		painter.add(new Rect(new Coordinate(left, top + size - fillHeight, size, fillHeight))
			.setOptions({fill: true, color: this.uiColor.get()}));

		// text
		painter.add(new Text(new Coordinate(left + size / 2, top + size / 2).align(Coordinate.Aligns.CENTER), this.uiText));
	}

	paintAt(painter, coordinate) {
		// background
		painter.add(new Rect(coordinate).setOptions({fill: true, color: this.uiColor.getShade()}));

		// foreground for current charges
		painter.add(new Rect(coordinate.clone.alignWithoutMove(Coordinate.Aligns.END).scale(1, this.duration.getRatio()))
			.setOptions({fill: true, color: this.uiColor.get()}));
	}
}

export default Buff;
