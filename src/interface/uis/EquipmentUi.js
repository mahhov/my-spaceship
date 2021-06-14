import EquipmentData from '../../playerData/EquipmentData.js';
import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiIconButton from '../components/UiIconButton.js';
import UiOutline from '../components/UiOutline.js';
import UiPopupText from '../components/UiPopupText.js';
import UiSection from '../components/UiSection.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import UiGridLayout from './layouts/UiGridLayout.js';
import Ui from './Ui.js';

let imagePaths = {
	equipmentTypes: {
		[EquipmentData.EquipmentTypes.hull]: '../../images/hull.png',
		[EquipmentData.EquipmentTypes.circuit]: '../../images/circuit.png',
		[EquipmentData.EquipmentTypes.thruster]: '../../images/thruster.png',
		[EquipmentData.EquipmentTypes.turret]: '../../images/turret.png',
	},
};

class EquipmentUi extends Ui {
	constructor(equipmentData) {
		super();
		let coordinate = HubUi.createSection('', false, .7).coordinate;

		const COLUMNS = 16, ROWS = 8;
		let buttonSize = coordinate.width / COLUMNS;
		let verticalMargin = (coordinate.height - (ROWS * 2 + 1) * buttonSize) / 2;

		let equippedCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(buttonSize * 4, buttonSize);
		this.createSection(equippedCoordinate, 'Equipped', 4, 1, buttonSize);
		// todo [high] swap
		// todo [high] unselect
		// todo [high] select
		// todo [high] hover

		let salvageCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START)
			.size(.07, buttonSize);
		let salvageButton = this.add(new UiButton(salvageCoordinate, 'Salvage'));
		salvageButton.on('hover', () =>
			hoverText.beginHover(salvageButton.bounds, `Salvage for ${EquipmentData.getSalvageCost(0)} metal`));
		// todo [high] disable/enable
		// todo [high] on click: salvage and unselect
		// todo [high] hover

		let forgeCoordinate = salvageCoordinate.clone
			.shift(-1, 0)
			.move(-Positions.MARGIN, 0)
			.size(buttonSize * 4, buttonSize);
		this.createSection(forgeCoordinate, 'Forge', 4, 1, buttonSize).forEach((button, i) => {
			button.imagePath = imagePaths.equipmentTypes[i];
			button.on('hover', () =>
				hoverText.beginHover(button.bounds, `Cost: ${EquipmentData.getForgeCost(i)} metal`));
			button.on('click', () => {
				equipmentData.forge(i);
				this.select();
			});
		});
		// todo [high] disable/enable

		let metalTextCoordinate = UiSection.getTextCoordinate(forgeCoordinate)
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.END);
		this.metalText = this.add(new UiText(metalTextCoordinate, '1200 metal'));

		let equipmentCoordinate = equippedCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin)
			.size(coordinate.width, ROWS * buttonSize);
		this.equippmentButtons = this.createSection(equipmentCoordinate, 'Inventory', COLUMNS, ROWS, buttonSize);
		this.equippmentButtons.forEach(button => button.on('click', () => this.select(button)));
		// todo [high] swap
		// todo [high] craft
		// todo [high] unselect
		// todo [high] select
		// todo [high] hover

		let materialsCoordinate = equipmentCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin);
		this.createSection(materialsCoordinate, 'Materials', COLUMNS, ROWS, buttonSize);
		// todo [high] swap
		// todo [high] select
		// todo [high] unselect
		// todo [high] hover

		let hoverText = this.add(new UiPopupText(new Coordinate(0, 0, .22, Positions.UI_LINE_HEIGHT + Positions.BREAK * 2)));

		let selectedUi = null;
		this.selectOutline = this.add(new UiOutline(new Coordinate(0, 0)));

		equipmentData.on('change', () => this.refresh(equipmentData));
		this.refresh(equipmentData);
	}

	createSection(coordinate, sectionTitle, columns, rows, buttonSize) {
		this.add(new UiSection(coordinate, sectionTitle));
		let layout = new UiGridLayout(coordinate, columns, buttonSize, 0, 0);
		return [...Array(columns * rows)].map((_, i) =>
			this.add(new UiIconButton(layout.getContainerCoordinate(i))));
	}

	select(button = null) {
		this.selectedUi = button;
		this.selectOutline.visible = !!button;
		this.selectOutline.coordinate = button?.coordinate;
	}

	refresh(equipmentData) {
		this.metalText.text = equipmentData.metal;
		this.equippmentButtons.forEach((button, i) =>
			button.imagePath = imagePaths.equipmentTypes[equipmentData.equipments[i]?.type]);
	}
}

export default EquipmentUi;
