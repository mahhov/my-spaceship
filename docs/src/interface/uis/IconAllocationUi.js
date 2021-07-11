import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiComponent from '../components/UiComponent.js';
import UiFill from '../components/UiFill.js';
import UiIconButton from '../components/UiIconButton.js';
import UiOutline from '../components/UiOutline.js';
import UiText from '../components/UiText.js';
import Ui from '../uis/Ui.js';

class IconAllocationUi extends Ui {
	constructor(coordinate, allocation) {
		super();
		this.allocation = allocation;

		let imagePath = `../../images/allocations/${allocation.imageName}`;
		this.containerButton = this.add(new UiIconButton(coordinate, imagePath));
		this.containerButton.on('click', (alt, shift) => this.emit(alt ? 'decrease' : 'increase', shift));
		this.bounds = this.containerButton.bounds;
		this.bubble(this.containerButton, 'hover');
		let valueCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.END)
			.size(UiComponent.textWidth(3), .014)
			.pad(-Positions.BREAK)
			.alignWithoutMove(Coordinate.Aligns.CENTER);
		this.add(new UiFill(valueCoordinate));
		this.add(new UiOutline(valueCoordinate.clone));
		this.valueText = this.add(new UiText(valueCoordinate.clone));
		this.refreshValue();
	}

	bind(data, hoverText) {
		this.on('hover', () => hoverText.beginHover(this.bounds, this.allocation.descriptionText));
		this.on('decrease', max => data.allocate(this.allocation, max ? -this.allocation.maxValue : -1));
		this.on('increase', max => data.allocate(this.allocation, max ? this.allocation.maxValue : 1));
		return this;
	}

	refreshValue() {
		this.valueText.text = this.allocation.valueText;
		this.containerButton.setPaintMode(this.allocation.value ? UiButton.PaintModes.ACTIVE : UiButton.PaintModes.NORMAL);
	}
}

export default IconAllocationUi;
