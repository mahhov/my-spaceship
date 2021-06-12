import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiSection from '../components/UiSection.js';
import HubUi from './HubUi.js';
import UiGridLayout from './layouts/UiGridLayout.js';
import Ui from './Ui.js';

class EquipmentUi extends Ui {
	constructor() {
		super();
		let coordinate = HubUi.createSection('', false, .7).coordinate;

		// todo [high] use icon buttons

		const COLUMNS = 16, ROWS = 8;
		let buttonSize = coordinate.width / COLUMNS;
		let verticalMargin = (coordinate.height - (ROWS * 2 + 1) * buttonSize) / 2;

		let equippedCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(buttonSize * 4, buttonSize);
		this.equippedButtons = this.createSection(equippedCoordinate, 'Equipped', 4, 1, buttonSize);

		let salvageCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START)
			.size(.07, buttonSize);
		this.add(new UiButton(salvageCoordinate, 'Salvage'));

		let forgeCoordinate = salvageCoordinate.clone
			.shift(-1, 0)
			.move(-Positions.MARGIN, 0)
			.size(buttonSize * 4, buttonSize);
		this.forgeButtons = this.createSection(forgeCoordinate, 'Forge', 4, 1, buttonSize);

		let inventoryCoordinate = equippedCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin)
			.size(coordinate.width, ROWS * buttonSize);
		this.inventoryButtons = this.createSection(inventoryCoordinate, 'Inventory', COLUMNS, ROWS, buttonSize);

		let materialsCoordinate = inventoryCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin);
		this.materialButtons = this.createSection(materialsCoordinate, 'Materials', COLUMNS, ROWS, buttonSize);
	}

	createSection(coordinate, sectionTitle, columns, rows, buttonSize) {
		this.add(new UiSection(coordinate, sectionTitle));
		let layout = new UiGridLayout(coordinate, columns, buttonSize, 0, 0);
		return [...Array(columns * rows)].map((_, i) =>
			this.add(new UiButton(layout.getContainerCoordinate(i), '')));
	}
}

export default EquipmentUi;
