import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import Ui from '../uis/Ui.js';

const BOTTOM_LINE_SPACING = 1.2, ALLOCATE_BUTTON_SIZE = 0.015;

// todo [medium] deprecated, replaces usages with IconAllocationUi
class AllocationUi extends Ui {
	constructor(coordinate, allocation, singleButton = false) {
		super(coordinate);
		this.allocation = allocation;

		let topLine = coordinate.clone
			.size(coordinate.width, Positions.UI_LINE_HEIGHT)
			.alignWithoutMove(Coordinate.Aligns.CENTER);
		let bottomLine = topLine.clone.shift(0, BOTTOM_LINE_SPACING);
		let buttonLine = bottomLine.clone.pad(.01, 0);
		let buttonLeft = buttonLine.clone
			.alignWithoutMove(Coordinate.Aligns.START, Coordinate.Aligns.CENTER)
			.size(ALLOCATE_BUTTON_SIZE);
		let buttonRight = buttonLine.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.CENTER)
			.size(ALLOCATE_BUTTON_SIZE);

		let containerButton = this.add(new UiButton(coordinate, '', '', !singleButton));
		if (singleButton)
			containerButton.on('click', alt => this.emit(alt ? 'decrease' : 'increase'));
		this.bounds = containerButton.bounds;
		this.bubble(containerButton, 'hover');
		this.add(new UiText(topLine, allocation.name));
		this.valueText = this.add(new UiText(bottomLine));
		this.updateValueText();
		if (!singleButton) {
			let decreaseButton = this.add(new UiButton(buttonLeft, '-'));
			this.bubble(decreaseButton, 'click', 'decrease');
			let increaseButton = this.add(new UiButton(buttonRight, '+'));
			this.bubble(increaseButton, 'click', 'increase');
		}
	}

	bind(data, hoverPopup) {
		this.on('hover', () => hoverPopup.beginHover(this.bounds, this.allocation.descriptionText));
		this.on('decrease', () => data.allocate(this.allocation, -1));
		this.on('increase', () => data.allocate(this.allocation, 1));
		return this;
	}

	static get width() {
		// todo [low] TraitUi should use this width rather than rely on layout calculations
		return .0834;
	}

	static get height() {
		return Positions.UI_LINE_HEIGHT * (1 + BOTTOM_LINE_SPACING);
	}

	updateValueText() {
		this.valueText.text = this.allocation.valueText;
	}
}

export default AllocationUi;
