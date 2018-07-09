const Rect = require('../painter/Rect');

class Ability {
	constructor(cooldown, stamina, charges, repeatable, paintUiColumn, paintUiColor) {
		this.currentCooldown = this.cooldown = cooldown;
		this.stamina = stamina;
		this.currentCharges = this.charges = charges;
		this.repeatable = repeatable;
		this.paintUiColumn = paintUiColumn;
		this.paintUiColor = paintUiColor;
	}

	safeActivate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		if (this.currentCharges && (this.repeatable || !this.repeating)) { // todo check stamina as well
			this.currentCharges--;
			// todo deplete stamina as well
			this.activate(originX, originY, directX, directY, logic, intersectionFinder, player);
		}
		this.repeating = 2;
	}

	activate(originX, originY, directX, directY, logic) {
	}

	refresh() {
		if (this.currentCharges < this.charges && !--this.currentCooldown) {
			this.currentCharges++;
			this.currentCooldown = this.cooldown;
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
		const ROW_HEIGHT = SIZE / this.charges;
		const HEIGHT = this.currentCharges * ROW_HEIGHT;
		painter.add(new Rect(LEFT, TOP + SIZE - HEIGHT, SIZE, HEIGHT, this.paintUiColor.get(), true));

		// hybrid for current cooldown
		if (this.currentCharges < this.charges) {
			let colorMult = (this.cooldown - this.currentCooldown) / this.cooldown;
			colorMult = BASE_COLOR_MULT + colorMult * (1 - BASE_COLOR_MULT);
			painter.add(new Rect(LEFT, TOP + SIZE - HEIGHT - ROW_HEIGHT, SIZE, ROW_HEIGHT, this.paintUiColor.multiply(colorMult).get(), true));
		}

		// todo paint stamina
	}
}

module.exports = Ability;
