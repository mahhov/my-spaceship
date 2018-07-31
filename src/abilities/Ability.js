const Charge = require('../util/Charge');
const {UiCs, UiPs} = require('../util/UiConstants');
const Rect = require('../painter/Rect');

class Ability {
	constructor(cooldown, charges, stamina, repeatable, uiIndex, paintUiColor) {
		this.cooldown = new Charge(cooldown, -1);
		this.charges = new Charge(charges, 1);
		this.stamina = stamina;
		this.repeatable = repeatable;
		this.uiIndex = uiIndex;
		this.paintUiColor = paintUiColor;
	}

	safeActivate(origin, direct, map, intersectionFinder, player) {
		if (this.ready)
			if (this.activate(origin, direct, map, intersectionFinder, player)) {
				this.charges.change(-1);
				player.consumeStamina(this.stamina);
			}
		this.repeating = 2;
	}

	activate(origin, direct, map, intersectionFinder, player) {
	}

	refresh(player) {
		if (!this.charges.isFull() && this.cooldown.increment()) {
			this.charges.increment();
			this.cooldown.restore();
		}
		this.repeating && this.repeating--;
		this.ready = !this.charges.isEmpty() && player.sufficientStamina(this.stamina) && (this.repeatable || !this.repeating)
	}

	paintUi(painter, camera) {
		// background
		const SIZE_WITH_MARGIN = UiPs.ABILITY_SIZE + UiPs.MARGIN;
		const LEFT = UiPs.MARGIN + this.uiIndex * SIZE_WITH_MARGIN, TOP = 1 - SIZE_WITH_MARGIN;
		painter.add(new Rect(LEFT, TOP, UiPs.ABILITY_SIZE, UiPs.ABILITY_SIZE, {fill: true, color: this.paintUiColor.getShade()}));

		// foreground for current charges
		const ROW_HEIGHT = UiPs.ABILITY_SIZE / this.charges.getMax();
		const HEIGHT = this.charges.get() * ROW_HEIGHT;
		painter.add(new Rect(LEFT, TOP + UiPs.ABILITY_SIZE - HEIGHT, UiPs.ABILITY_SIZE, HEIGHT, {fill: true, color: this.paintUiColor.get()}));

		// hybrid for current cooldown
		if (!this.cooldown.isFull()) {
			let shade = this.cooldown.getRatio();
			painter.add(new Rect(LEFT, TOP + UiPs.ABILITY_SIZE - HEIGHT - ROW_HEIGHT, UiPs.ABILITY_SIZE, ROW_HEIGHT, {fill: true, color: this.paintUiColor.getShade(shade)}));
		}

		if (!this.ready)
			painter.add(new Rect(LEFT, TOP, UiPs.ABILITY_SIZE, UiPs.ABILITY_SIZE, {color: UiCs.NOT_READY_COLOR.get(), thickness: 4}));
	}
}

module.exports = Ability;
