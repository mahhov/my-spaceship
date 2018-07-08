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
		const MARGIN = .02, SIZE = .06, SIZE_WITH_MARGIN = SIZE + MARGIN; // todo extract Ability and LivingEnetity marigns and colors to Ui constants file
		const LEFT = MARGIN + this.paintUiColumn * SIZE_WITH_MARGIN, TOP = 1 - SIZE_WITH_MARGIN;

		painter.add(new Rect(LEFT, TOP, SIZE, SIZE, this.paintUiColor, true));

		// todo paint according to cooldown and charge remaining
		// todo paint stamina
		// const EMPTY_COLOR = '#f66', FILL_COLOR = '#09c';
		// painter.add(new Rect(MARGIN, TOP, WIDTH, MARGIN, EMPTY_COLOR, true));
		// painter.add(new Rect(MARGIN, TOP, WIDTH * this.health, MARGIN, FILL_COLOR, true));
		// painter.add(new Rect(MARGIN, TOP, WIDTH, MARGIN, EMPTY_COLOR, false));
	}
}

module.exports = Ability;
