import Rect from '../painter/elements/Rect.js';
import Text from '../painter/elements/Text.js';
import {Positions} from '../util/Constants.js';
import Coordinate from '../util/Coordinate.js';
import Pool from '../util/Pool.js';

class Buff {
	constructor(duration, uiColor, uiText) {
		// duration param of 0 will be infinite, 1 will be active for 1 tick
		this.durationUnlimited = !duration;
		this.duration = new Pool(duration + 1, -1);
		this.uiColor = uiColor;
		this.uiText = uiText;
	}

	setUiIndex(uiIndex) {
		this.uiIndex = uiIndex;
	}

	// returns 1 if unmodified
	static get_(buffs, key) {
		return buffs.reduce((acc, {[key]: value = 0}) => acc + value, 1);
	}

	static moveSpeed(buffs) {
		return Buff.get_(buffs, 'moveSpeed_');
	}

	static attackRange(buffs) {
		return Buff.get_(buffs, 'attackRange_');
	}

	static armor(buffs) {
		return Buff.get_(buffs, 'armor_');
	}

	static disabled(buffs) {
		return Buff.get_(buffs, 'disabled_') > 1;
	}

	set moveSpeed(value) {
		this.moveSpeed_ = value;
	}

	set attackRange(value) {
		this.attackRange_ = value;
	}

	set armor(value) {
		this.armor_ = value;
	}

	set disabled(value) {
		this.disabled_ = value;
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

export default Buff;
