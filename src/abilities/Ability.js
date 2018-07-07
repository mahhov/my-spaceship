const Rect = require('../painter/Rect');

class Ability {
	constructor(cooldown, stamina, maxCharges, paintUiColumn, paintUiColor) {
		this.cooldown = cooldown;
		this.stamina = stamina;
		this.maxCharges = maxCharges;
		this.paintUiColumn = paintUiColumn;
		this.paintUiColor = paintUiColor;
	}

	activate(originX, originY, directX, directY, logic) {
		// todo add some coooldown, stamina, and charge management
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
