import Rect from '../painter/elements/Rect.js';
import Text from '../painter/elements/Text.js';
import {Positions} from '../util/Constants.js';
import Coordinate from '../util/Coordinate.js';
import makeEnum from '../util/Enum.js';
import Pool from '../util/Pool.js';

const Keys = makeEnum({MOVE_SPEED: 0, ATTACK_RANGE: 0, ARMOR: 0, DISABLED: 0});

class Buff {
	constructor(duration, uiColor, uiText) {
		// duration param of 0 will be infinite, 1 will be active for 1 tick
		this.durationUnlimited = !duration;
		this.duration = new Pool(duration + 1, -1);
		this.uiColor = uiColor;
		this.uiText = uiText;
		this.effects = {};
	}

	setUiIndex(uiIndex) {
		this.uiIndex = uiIndex;
	}

	// returns 1 if unmodified
	static sum(buffs, key) {
		return buffs
			.map(buff => buff.effects[key] || 0)
			.reduce((a, b) => a + b, 1);
	}

	static moveSpeed(buffs) {
		return Buff.sum(buffs, Keys.MOVE_SPEED);
	}

	static attackRange(buffs) {
		return Buff.sum(buffs, Keys.ATTACK_RANGE);
	}

	static armor(buffs) {
		return Buff.sum(buffs, Keys.ARMOR);
	}

	static disabled(buffs) {
		return Buff.sum(buffs, Keys.DISABLED) > 1;
	}

	setEffect(key, value) {
		this.effects[key] = value;
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

	paintUi(painter, camera) {
		let left = 1 - (this.uiIndex + 1) * (Positions.BUFF_SIZE + Positions.MARGIN);
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

	paintAt(painter, camera, left, top, size) {
		// background
		painter.add(Rect.withCamera(camera, new Coordinate(left, top, size), {fill: true, color: this.uiColor.getShade()}));

		// foreground for current charges
		let fillHeight = size * this.duration.getRatio();
		painter.add(Rect.withCamera(camera, new Coordinate(left, top + size - fillHeight, size, fillHeight), {fill: true, color: this.uiColor.get()}));
	}
}

Buff.Keys = Keys;

export default Buff;
