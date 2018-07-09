const Rect = require('../painter/Rect');

class Ability {
	constructor(cooldown, charges, stamina, repeatable, paintUiColumn, paintUiColor) {
		this.maxCooldown = this.cooldown = cooldown;
		this.maxCharges = this.charges = charges;
		this.stamina = stamina;
		this.repeatable = repeatable;
		this.paintUiColumn = paintUiColumn;
		this.paintUiColor = paintUiColor;
	}

	safeActivate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		if (this.charges && (this.repeatable || !this.repeating)) { // todo check stamina as well
			this.charges--;
			// todo deplete stamina as well
			this.activate(originX, originY, directX, directY, logic, intersectionFinder, player);
		}
		this.repeating = 2;
	}

	activate(originX, originY, directX, directY, logic) {
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
		const BASE_COLOR_MULT = .5;
		const MARGIN = .02, SIZE = .06, SIZE_WITH_MARGIN = SIZE + MARGIN;
		const LEFT = MARGIN + this.paintUiColumn * SIZE_WITH_MARGIN, TOP = 1 - SIZE_WITH_MARGIN;
		painter.add(new Rect(LEFT, TOP, SIZE, SIZE, this.paintUiColor.multiply(BASE_COLOR_MULT).get(), true));

		// foreground for current charges
		const ROW_HEIGHT = SIZE / this.maxCharges;
		const HEIGHT = this.charges * ROW_HEIGHT;
		painter.add(new Rect(LEFT, TOP + SIZE - HEIGHT, SIZE, HEIGHT, this.paintUiColor.get(), true));

		// hybrid for current cooldown
		if (this.cooldown < this.maxCooldown) {
			let colorMult = (this.maxCooldown - this.cooldown) / this.maxCooldown;
			colorMult = BASE_COLOR_MULT + colorMult * (1 - BASE_COLOR_MULT);
			painter.add(new Rect(LEFT, TOP + SIZE - HEIGHT - ROW_HEIGHT, SIZE, ROW_HEIGHT, this.paintUiColor.multiply(colorMult).get(), true));
		}

		// todo paint stamina
	}
}

module.exports = Ability;
