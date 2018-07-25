const {UiCs, UiPs} = require('../util/UiConstants');
const Rect = require('../painter/Rect');

class Ability {
	constructor(cooldown, charges, stamina, repeatable, uiIndex, paintUiColor) {
		this.maxCooldown = this.cooldown = cooldown;
		this.maxCharges = this.charges = charges;
		this.stamina = stamina;
		this.repeatable = repeatable;
		this.uiIndex = uiIndex;
		this.paintUiColor = paintUiColor;
	}

	safeActivate(origin, direct, map, intersectionFinder, player) {
		if (this.charges && player.sufficientStamina(this.stamina) && (this.repeatable || !this.repeating))
			if (this.activate(origin, direct, map, intersectionFinder, player)) {
				this.charges--;
				player.consumeStamina(this.stamina);
			}
		this.repeating = 2;
	}

	activate(origin, direct, map, intersectionFinder, player) {
	}

	refresh() {
		if (this.charges < this.maxCharges && !--this.cooldown) {
			this.charges++;
			this.cooldown = this.maxCooldown;
		}
		this.repeating && this.repeating--;
	}

	paintUi(painter, camera) {
		// background
		const SIZE_WITH_MARGIN = UiPs.ABILITY_SIZE + UiPs.MARGIN;
		const LEFT = UiPs.MARGIN + this.uiIndex * SIZE_WITH_MARGIN, TOP = 1 - SIZE_WITH_MARGIN;
		painter.add(new Rect(LEFT, TOP, UiPs.ABILITY_SIZE, UiPs.ABILITY_SIZE, {fill: true, color: this.paintUiColor.getShade()}));

		// foreground for current charges
		const ROW_HEIGHT = UiPs.ABILITY_SIZE / this.maxCharges;
		const HEIGHT = this.charges * ROW_HEIGHT;
		painter.add(new Rect(LEFT, TOP + UiPs.ABILITY_SIZE - HEIGHT, UiPs.ABILITY_SIZE, HEIGHT, {fill: true, color: this.paintUiColor.get()}));

		// hybrid for current cooldown
		if (this.cooldown < this.maxCooldown) {
			let shade = 1 - (this.maxCooldown - this.cooldown) / this.maxCooldown;
			painter.add(new Rect(LEFT, TOP + UiPs.ABILITY_SIZE - HEIGHT - ROW_HEIGHT, UiPs.ABILITY_SIZE, ROW_HEIGHT, {fill: true, color: this.paintUiColor.getShade(shade)}));
		}

		// todo paint stamina sufficient or stamina cost
	}
}

module.exports = Ability;
