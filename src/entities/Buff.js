const Pool = require('../util/Pool');
const {Positions} = require('../util/Constants');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');

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

	static armor(buffs) {
		return Buff.get_(buffs, 'armor_');
	}

	set moveSpeed(value) {
		this.moveSpeed_ = value;
	}

	set armor(value) {
		this.armor_ = value;
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
		// background
		const SIZE_WITH_MARGIN = Positions.BUFF_SIZE + Positions.MARGIN;
		const LEFT = 1 - (this.uiIndex + 1) * SIZE_WITH_MARGIN;
		const TOP = 1 - Positions.MARGIN * 3 - Positions.BAR_HEIGHT * 2 - Positions.BUFF_SIZE;
		painter.add(new Rect(LEFT, TOP, Positions.BUFF_SIZE, Positions.BUFF_SIZE, {fill: true, color: this.uiColor.getShade()}));

		// foreground for current charges
		const HEIGHT = Positions.BUFF_SIZE * this.duration.getRatio();
		painter.add(new Rect(LEFT, TOP + Positions.BUFF_SIZE - HEIGHT, Positions.BUFF_SIZE, HEIGHT, {fill: true, color: this.uiColor.get()}));

		// letter
		painter.add(new Text(LEFT + Positions.BUFF_SIZE / 2, TOP + Positions.BUFF_SIZE / 2, this.uiText));
	}
}

module.exports = Buff;
