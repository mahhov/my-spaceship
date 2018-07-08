const Rect = require('../painter/Rect');

class Ability {
	constructor(cooldown, stamina, charges, paintUiColumn, paintUiColor) {
		this.currentCooldown = this.cooldown = cooldown;
		this.stamina = stamina;
		this.currentCharges = this.charges = charges;

		this.paintUiColumn = paintUiColumn;
		this.paintUiColor = paintUiColor;
	}

	safeActivate(originX, originY, directX, directY, logic) {
		if (this.currentCharges) { // todo check stamina as well
			this.currentCharges--;
			// todo deplete stamina as well
			this.activate(originX, originY, directX, directY, logic);
		}
	}

	activate(originX, originY, directX, directY, logic) {
	}

	refresh() {
		if (this.currentCharges < this.charges && !--this.currentCooldown) {
			this.currentCharges++;
			this.currentCooldown = this.cooldown;
		}
	}

	paintUi(painter) {
		// background
		const BASE_COLOR_MULT = .5;
		const MARGIN = .02, SIZE = .06, SIZE_WITH_MARGIN = SIZE + MARGIN; // todo extract Ability and LivingEnetity marigns and colors to Ui constants file
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

		// todo line serpators

		// todo paint stamina
	}
}

module.exports = Ability;
