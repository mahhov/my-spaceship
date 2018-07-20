const {UiCs, UiPs} = require('../UiConstants');
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

	safeActivate(origin, direct, logic, intersectionFinder, player) {
		if (this.charges && player.sufficientStamina(this.stamina) && (this.repeatable || !this.repeating))
			if (this.activate(origin, direct, logic, intersectionFinder, player)) {
				this.charges--;
				player.consumeStamina(this.stamina);
			}
		this.repeating = 2;
	}

	activate(origin, direct, logic, intersectionFinder, player) {
	}

	refresh() {
		if (this.charges < this.maxCharges && !--this.cooldown) {
			this.charges++;
			this.cooldown = this.maxCooldown;
		}
		this.repeating && this.repeating--;
	}

	paintUi(painter) {
		// background
		const SIZE_WITH_MARGIN = UiPs.ABILITY_SIZE + UiPs.MARGIN;
		const LEFT = UiPs.MARGIN + this.uiIndex * SIZE_WITH_MARGIN, TOP = 1 - SIZE_WITH_MARGIN;
		painter.add(new Rect(LEFT, TOP, UiPs.ABILITY_SIZE, UiPs.ABILITY_SIZE, this.paintUiColor.getShade(), true));

		// foreground for current charges
		const ROW_HEIGHT = UiPs.ABILITY_SIZE / this.maxCharges;
		const HEIGHT = this.charges * ROW_HEIGHT;
		painter.add(new Rect(LEFT, TOP + UiPs.ABILITY_SIZE - HEIGHT, UiPs.ABILITY_SIZE, HEIGHT, this.paintUiColor.get(), true));

		// hybrid for current cooldown
		if (this.cooldown < this.maxCooldown) {
			let shade = 1 - (this.maxCooldown - this.cooldown) / this.maxCooldown;
			painter.add(new Rect(LEFT, TOP + UiPs.ABILITY_SIZE - HEIGHT - ROW_HEIGHT, UiPs.ABILITY_SIZE, ROW_HEIGHT, this.paintUiColor.getShade(shade), true));
		}

		// todo paint stamina sufficient or stamina cost
	}
}

module.exports = Ability;
