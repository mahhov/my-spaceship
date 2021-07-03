import {Positions} from '../../util/constants.js';
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

		this.containerButton = this.add(new UiButton(coordinate, '', '', !singleButton));
		if (singleButton)
			this.containerButton.on('click', (alt, shift) => this.emit(alt ? 'decrease' : 'increase', shift));
		this.bounds = this.containerButton.bounds;
		this.bubble(this.containerButton, 'hover');
		this.add(new UiText(topLine, allocation.name));
		this.valueText = this.add(new UiText(bottomLine));
		this.updateValueText();
		if (!singleButton) {
			this.add(new UiButton(buttonLeft, '-')).on('click', (_, shift) => this.emit('decrease', shift));
			this.add(new UiButton(buttonRight, '+')).on('click', (_, shift) => this.emit('increase', shift));
		}
	}

	bind(data, hoverPopup) {
		this.on('hover', () => hoverPopup.beginHover(this.bounds, this.allocation.descriptionText));
		this.on('decrease', max => data.allocate(this.allocation, max ? -this.allocation.maxValue : -1));
		this.on('increase', max => data.allocate(this.allocation, max ? this.allocation.maxValue : 1));
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

	updateActive() {
		// todo [high] visually indicate selected without stopping hover and click events
		// this.containerButton.forcedActive = this.allocation.value;
	}
}

export default AllocationUi;
