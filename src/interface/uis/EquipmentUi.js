import Equipment from '../../playerData/Equipment.js';
import EquipmentData from '../../playerData/EquipmentData.js';
import Material from '../../playerData/Material.js';
import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import makeEnum from '../../util/enum.js';
import UiButton from '../components/UiButton.js';
import UiDragShadow from '../components/UiDragShadow.js';
import UiIconButton from '../components/UiIconButton.js';
import UiOutline from '../components/UiOutline.js';
import UiPopupText from '../components/UiPopupText.js';
import UiSection from '../components/UiSection.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import UiGridLayout from './layouts/UiGridLayout.js';
import Ui from './Ui.js';

const ImagePaths = {
	Equipment: {
		[Equipment.Types.HULL]: '../../images/hull.png',
		[Equipment.Types.CIRCUIT]: '../../images/circuit.png',
		[Equipment.Types.THRUSTER]: '../../images/thruster.png',
		[Equipment.Types.TURRET]: '../../images/turret.png',
	},
	Materials: {
		[Material.Types.A]: '../../images/rune.png',
	},
};

const ButtonTypes = makeEnum({EQUIPPED: 0, INVENTORY: 0, MATERIAL: 0, SALVAGE: 0});

class ButtonIndex {
	constructor(buttonType, index, button) {
		this.buttonType = buttonType;
		this.index = index;
		this.button = button;
	}
}

class EquipmentUi extends Ui {
	constructor(equipmentData) {
		super();
		this.equipmentData = equipmentData;
		let coordinate = HubUi.createSection('', false, .7).coordinate;

		const COLUMNS = 16, ROWS = 8;
		let buttonSize = coordinate.width / COLUMNS;
		let verticalMargin = (coordinate.height - (ROWS * 2 + 1) * buttonSize) / 2;

		let equippedCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(buttonSize * 4, buttonSize);
		this.equippedButtons = this.createSection(equippedCoordinate, 'Equipped', 4, 1, buttonSize);
		this.addButtonListeners(this.equippedButtons, ButtonTypes.EQUIPPED);

		let salvageCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START)
			.size(.07, buttonSize);
		this.salvageButton = this.add(new UiButton(salvageCoordinate, 'Salvage'));
		let salvageButtonIndex = new ButtonIndex(ButtonTypes.SALVAGE, 0, this.salvageButton);
		this.salvageButton.on('hover', () => {
			let equipmentType = (this.dragIndex.buttonType === ButtonTypes.EQUIPPED ?
				this.equipmentData.equipped : this.equipmentData.inventory)[this.dragIndex.index].type;
			hoverText.beginHover(this.salvageButton.bounds, `Salvage for ${EquipmentData.getSalvageCost(equipmentType)} metal`);
			this.dropIndex = salvageButtonIndex;
		});

		let forgeCoordinate = salvageCoordinate.clone
			.shift(-1, 0)
			.move(-Positions.MARGIN, 0)
			.size(buttonSize * 4, buttonSize);
		this.createSection(forgeCoordinate, 'Forge', 4, 1, buttonSize).forEach((button, i) => {
			button.imagePath = ImagePaths.Equipment[i];
			button.on('hover', () =>
				hoverText.beginHover(button.bounds, `Cost: ${EquipmentData.getForgeCost(i)} metal`));
			button.on('click', () => equipmentData.forge(i));
		});

		let metalTextCoordinate = UiSection.getTextCoordinate(forgeCoordinate)
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.END);
		this.metalText = this.add(new UiText(metalTextCoordinate, '0 metal'));

		let inventoryCoordinate = equippedCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin)
			.size(coordinate.width, ROWS * buttonSize);
		this.inventoryButtons = this.createSection(inventoryCoordinate, 'Inventory', COLUMNS, ROWS, buttonSize);
		this.addButtonListeners(this.inventoryButtons, ButtonTypes.INVENTORY);

		let materialsCoordinate = inventoryCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin);
		this.materialButtons = this.createSection(materialsCoordinate, 'Materials', COLUMNS, ROWS, buttonSize);
		this.addButtonListeners(this.materialButtons, ButtonTypes.MATERIAL);

		let hoverText = this.add(new UiPopupText(new Coordinate(0, 0, .22, Positions.UI_LINE_HEIGHT + Positions.BREAK * 2)));

		this.dragIndex = new ButtonIndex();
		this.dropIndex = new ButtonIndex();
		this.dragOutline = this.add(new UiOutline(new Coordinate(0, 0)));
		this.dragShadow = this.add(new UiDragShadow());
		this.dragShadow.on('drop', () => this.drop());
		this.drop();

		equipmentData.on('change', () => this.refresh());
		this.refresh();
	}

	createSection(coordinate, sectionTitle, columns, rows, buttonSize) {
		this.add(new UiSection(coordinate, sectionTitle));
		let layout = new UiGridLayout(coordinate, columns, buttonSize, 0, 0);
		return [...Array(columns * rows)].map((_, i) =>
			this.add(new UiIconButton(layout.getContainerCoordinate(i))));
	}

	addButtonListeners(buttons, buttonType) {
		buttons.forEach((button, i) => {
			let buttonIndex = new ButtonIndex(buttonType, i, button);
			button.on('hover', () => this.dropIndex = buttonIndex);
			button.on('click', () => this.drag(buttonIndex));
		});
	}

	drag(buttonIndex) {
		this.dragIndex = buttonIndex;
		this.salvageButton.disabled = buttonIndex.buttonType === ButtonTypes.MATERIAL;
		this.enableEmptyButtons();
		this.dragOutline.visible = true;
		this.dragOutline.coordinate = buttonIndex.button.coordinate;
		this.dragShadow.beginDrag(buttonIndex.button);
	}

	drop() {
		let [i1, i2] = [this.dragIndex, this.dropIndex].sort((a, b) => a.buttonType - b.buttonType);
		let i1IsEquipment = i1.buttonType === ButtonTypes.EQUIPPED || i1.buttonType === ButtonTypes.INVENTORY;
		if (i1.buttonType === ButtonTypes.INVENTORY && i2.buttonType === ButtonTypes.INVENTORY)
			this.equipmentData.swapInventory(i1.index, i2.index);
		else if (i1.buttonType === ButtonTypes.MATERIAL && i2.buttonType === ButtonTypes.MATERIAL)
			this.equipmentData.swapMaterial(i1.index, i2.index);
		else if (this.dragIndex.buttonType === ButtonTypes.EQUIPPED && this.dropIndex.buttonType === ButtonTypes.INVENTORY &&
			this.equipmentData.inventory[this.dropIndex.index] &&
			this.equipmentData.inventory[this.dropIndex.index].type !== this.dragIndex.index) {
			let inventoryIndex = this.equipmentData.emptyInventoryIndex;
			if (inventoryIndex !== -1)
				this.equipmentData.equip(this.dragIndex.index, inventoryIndex);
		} else if (i1.buttonType === ButtonTypes.EQUIPPED && i2.buttonType === ButtonTypes.INVENTORY)
			this.equipmentData.equip(this.equipmentData.inventory[i2.index]?.type ?? i1.index, i2.index);
		else if (i1IsEquipment && i2.buttonType === ButtonTypes.SALVAGE)
			this.equipmentData.salvage(i1.buttonType === ButtonTypes.EQUIPPED, i1.index);
		else if (i1IsEquipment && i2.buttonType === ButtonTypes.MATERIAL)
			this.equipmentData.craft(i1.buttonType === ButtonTypes.EQUIPPED, i1.index, i2.index);

		this.dragIndex = null;
		this.dragOutline.visible = false;
		this.salvageButton.disabled = true;
		this.disableEmptyButtons();
	}

	refresh() {
		this.equippedButtons.forEach((button, i) =>
			button.imagePath = ImagePaths.Equipment[this.equipmentData.equipped[i]?.type]);
		this.metalText.text = this.equipmentData.metal;
		this.inventoryButtons.forEach((button, i) =>
			button.imagePath = ImagePaths.Equipment[this.equipmentData.inventory[i]?.type]);
		this.materialButtons.forEach((button, i) =>
			button.imagePath = ImagePaths.Materials[this.equipmentData.materials[i]?.type]);
		this.disableEmptyButtons();
	}

	disableEmptyButtons() {
		this.equippedButtons.forEach((button, i) => button.disabled = !this.equipmentData.equipped[i]);
		this.inventoryButtons.forEach((button, i) => button.disabled = !this.equipmentData.inventory[i]);
		this.materialButtons.forEach((button, i) => button.disabled = !this.equipmentData.materials[i]);
	}

	enableEmptyButtons() {
		this.equippedButtons.forEach((button, i) => button.disabled = !this.equipmentData.equipped[i] && this.dragIndex.buttonType !== ButtonTypes.INVENTORY);
		this.inventoryButtons.forEach((button, i) => button.disabled = !this.equipmentData.inventory[i] && this.dragIndex.buttonType !== ButtonTypes.EQUIPPED && this.dragIndex.buttonType !== ButtonTypes.INVENTORY);
		this.materialButtons.forEach((button, i) => button.disabled = !this.equipmentData.materials[i] && this.dragIndex.buttonType !== ButtonTypes.MATERIAL);
	}
}

export default EquipmentUi;
