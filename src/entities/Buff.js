const {Positions} = require('../util/Constants');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');

class Buff {
	constructor(uiColor, uiText) {
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
		return this.duration && !--this.duration;
	}

	expire() {
		this.duration = 1;
	}

	paintUi(painter, camera) {
		// todo [high] paint on left side of canvas and avoid overlap with minimap
		// todo [high] paint fill to represent duration and max duration
		// background
		const SIZE_WITH_MARGIN = Positions.BUFF_SIZE + Positions.MARGIN;
		const LEFT = Positions.MARGIN + this.uiIndex * SIZE_WITH_MARGIN, TOP = Positions.MARGIN;
		painter.add(new Rect(LEFT, TOP, Positions.BUFF_SIZE, Positions.BUFF_SIZE, {fill: true, color: this.uiColor.get()}));

		// letter
		painter.add(new Text(LEFT + Positions.BUFF_SIZE / 2, TOP + Positions.BUFF_SIZE / 2, this.uiText));
	}
}

module.exports = Buff;
