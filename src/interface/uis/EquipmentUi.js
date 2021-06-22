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
import GridLayout from '../layouts/GridLayout.js';
import HubUi from './HubUi.js';
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

const ButtonTypes = makeEnum({...EquipmentData.ListTypes, SALVAGE: 0});

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

		let salvageCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START)
			.size(.07, buttonSize);
		this.salvageButton = this.add(new UiButton(salvageCoordinate, 'Salvage'));
		let salvageButtonIndex = new ButtonIndex(ButtonTypes.SALVAGE, 0, this.salvageButton);
		this.salvageButton.on('hover', () => {
			let equipmentType = (this.dragIndex.buttonType === ButtonTypes.EQUIPPED ?
				this.equipmentData.equipped : this.equipmentData.inventory)[this.dragIndex.index].type;
			this.hoverText.beginHover(this.salvageButton.bounds, [`Salvage for ${EquipmentData.getSalvageCost(equipmentType)} metal`]);
			this.dropIndex = salvageButtonIndex;
		});
		this.salvageButton.on('end-hover', () => this.resetDropIndex(salvageButtonIndex));

		let forgeCoordinate = salvageCoordinate.clone
			.shift(-1, 0)
			.move(-Positions.MARGIN, 0)
			.size(buttonSize * 4, buttonSize);
		this.forgeButtons = this.createSection(forgeCoordinate, 'Forge', 4, 1, buttonSize);
		this.forgeButtons.forEach((button, i) => {
			button.imagePath = ImagePaths.Equipment[i];
			button.on('hover', () =>
				this.hoverText.beginHover(button.bounds, [`Cost: ${EquipmentData.getForgeCost(i)} metal`]));
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

		let materialsCoordinate = inventoryCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin);
		this.materialButtons = this.createSection(materialsCoordinate, 'Materials', COLUMNS, ROWS, buttonSize);

		this.buttonSets.forEach(({buttons, listType}) => buttons.forEach((button, i) => {
			let buttonIndex = new ButtonIndex(listType, i, button);
			button.on('hover', () => {
				this.dropIndex = buttonIndex;
				this.refreshHoverText();
			});
			button.on('end-hover', () => this.resetDropIndex(buttonIndex));
			button.on('click', () => this.drag(buttonIndex));
		}));

		this.dragIndex = null;
		this.dropIndex = null;
		this.dragOutline = this.add(new UiOutline(new Coordinate(0, 0)));
		this.dragShadow = this.add(new UiDragShadow());
		this.dragShadow.on('drop', () => this.drop());
		this.drop();

		this.hoverText = this.add(new UiPopupText(new Coordinate(0, 0, .22)));

		equipmentData.on('change', () => this.refresh());
		this.refresh();
	}

	createSection(coordinate, sectionTitle, columns, rows, buttonSize) {
		this.add(new UiSection(coordinate, sectionTitle));
		let layout = new GridLayout(coordinate, columns, buttonSize, 0, 0);
		return [...Array(columns * rows)].map((_, i) =>
			this.add(new UiIconButton(layout.getCoordinates(i).container)));
	}

	drag(buttonIndex) {
		this.dragIndex = buttonIndex;
		this.salvageButton.disabled = buttonIndex.buttonType === ButtonTypes.MATERIAL;
		this.forgeButtons.forEach(button => button.disabled = true);
		this.enableEmptyButtons();
		this.dragOutline.visible = true;
		this.dragOutline.coordinate = buttonIndex.button.coordinate;
		this.dragShadow.beginDrag(buttonIndex.button);
	}

	resetDropIndex(buttonIndex) {
		if (this.dropIndex === buttonIndex)
			this.dropIndex = null;
	}

	drop() {
		if (this.dropIndex) {
			let [i1, i2] = [this.dragIndex, this.dropIndex].sort((a, b) => a.buttonType - b.buttonType);
			let i1IsEquipment = i1.buttonType === ButtonTypes.EQUIPPED || i1.buttonType === ButtonTypes.INVENTORY;
			if (i1.buttonType === ButtonTypes.INVENTORY && i2.buttonType === ButtonTypes.INVENTORY)
				this.equipmentData.swapInventory(i1.index, i2.index);
			else if (i1.buttonType === ButtonTypes.MATERIAL && i2.buttonType === ButtonTypes.MATERIAL)
				this.equipmentData.swapMaterial(i1.index, i2.index);
			else if (this.dragIndex.buttonType === ButtonTypes.EQUIPPED && this.dropIndex.buttonType === ButtonTypes.INVENTORY &&
				this.equipmentData.inventory[this.dropIndex.index]?.type !== this.dragIndex.index)
				this.equipmentData.unequip(this.dragIndex.index, this.dropIndex.index);
			else if (i1.buttonType === ButtonTypes.EQUIPPED && i2.buttonType === ButtonTypes.INVENTORY)
				this.equipmentData.equip(i2.index);
			else if (i1IsEquipment && i2.buttonType === ButtonTypes.SALVAGE)
				this.equipmentData.salvage(i1.buttonType, i1.index);
			else if (i1IsEquipment && i2.buttonType === ButtonTypes.MATERIAL)
				this.equipmentData.craft(i1.buttonType, i1.index, i2.index);
		}

		this.dragIndex = null;
		this.dragOutline.visible = false;
		this.salvageButton.disabled = true;
		this.forgeButtons.forEach(button => button.disabled = false);
		this.disableEmptyButtons();
	}

	refresh() {
		this.buttonSets.forEach(({buttons, images, listType}) => buttons.forEach((button, i) =>
			button.imagePath = images[this.equipmentData.getList(listType)[i]?.type]));
		this.metalText.text = this.equipmentData.metal;
		this.disableEmptyButtons();
		this.refreshHoverText();
	}

	refreshHoverText() {
		if (!this.dropIndex || this.dropIndex.buttonType === ButtonTypes.SALVAGE)
			this.hoverText.endHover();
		else {
			let statItem = this.equipmentData.getList(this.dropIndex.buttonType)[this.dropIndex.index];
			if (statItem)
				this.hoverText.beginHover(this.dropIndex.button.bounds, statItem.descriptionText);
		}
	}

	disableEmptyButtons() {
		this.buttonSets.forEach(({buttons, listType}) => buttons.forEach((button, i) =>
			button.disabled = !this.equipmentData.getList(listType)[i]));
	}

	enableEmptyButtons() {
		this.buttonSets.forEach(({buttons, listType, enabledIfDragging}) => buttons.forEach((button, i) =>
			button.disabled = !this.equipmentData.getList(listType)[i] && !enabledIfDragging.includes(this.dragIndex.buttonType)));
	}

	get buttonSets() {
		return [
			{
				buttons: this.equippedButtons,
				images: ImagePaths.Equipment,
				listType: EquipmentData.ListTypes.EQUIPPED,
				enabledIfDragging: [ButtonTypes.INVENTORY],
			},
			{
				buttons: this.inventoryButtons,
				images: ImagePaths.Equipment,
				listType: EquipmentData.ListTypes.INVENTORY,
				enabledIfDragging: [ButtonTypes.EQUIPPED, ButtonTypes.INVENTORY],
			},
			{
				buttons: this.materialButtons,
				images: ImagePaths.Materials,
				listType: EquipmentData.ListTypes.MATERIAL,
				enabledIfDragging: [ButtonTypes.MATERIAL],
			},
		];
	}
}

export default EquipmentUi;
