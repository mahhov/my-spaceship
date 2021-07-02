import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiComponent from '../components/UiComponent.js';
import UiFill from '../components/UiFill.js';
import UiIconButton from '../components/UiIconButton.js';
import UiOutline from '../components/UiOutline.js';
import UiText from '../components/UiText.js';
import Ui from '../uis/Ui.js';

class IconAllocationUi extends Ui {
	constructor(coordinate, allocation) {
		super(coordinate);
		this.allocation = allocation;

		let containerButton = this.add(new UiIconButton(coordinate, `../../images/allocations/${allocation.imageName}`));
		containerButton.on('click', (alt, shift) => this.emit(alt ? 'decrease' : 'increase', shift));
		this.bounds = containerButton.bounds;
		this.bubble(containerButton, 'hover');
		let valueCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.END)
			.size(UiComponent.textWidth(3), .014)
			.pad(-Positions.BREAK)
			.alignWithoutMove(Coordinate.Aligns.CENTER);
		this.add(new UiFill(valueCoordinate));
		this.add(new UiOutline(valueCoordinate));
		this.valueText = this.add(new UiText(valueCoordinate));
		this.updateValueText();
	}

	bind(data, hoverPopup) {
		this.on('hover', () => hoverPopup.beginHover(this.bounds, this.allocation.descriptionText));
		this.on('decrease', max => data.allocate(this.allocation, max ? -this.allocation.maxValue : -1));
		this.on('increase', max => data.allocate(this.allocation, max ? this.allocation.maxValue : 1));
		return this;
	}

	updateValueText() {
		this.valueText.text = this.allocation.valueText;
	}
}

export default IconAllocationUi;
