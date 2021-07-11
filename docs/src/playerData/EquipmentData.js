import Emitter from '../util/Emitter.js';
import makeEnum from '../util/enum.js';
import {randInt} from '../util/number.js';
import Equipment from './Equipment.js';
import Material from './Material.js';
import Stat from './Stat.js';

const maxInventory = 128, maxMaterials = 128;

const ListTypes = makeEnum({EQUIPPED: 0, INVENTORY: 0, MATERIAL: 0});

class EquipmentData extends Emitter {
	constructor() {
		super();
		this.metal = 0;
		this.equipped = [...Array(4)];
		this.inventory = [...Array(maxInventory)];
		this.materials = [...Array(maxMaterials)];
	}

	get stored() {
		return {
			metal: this.metal,
			equipped: EquipmentData.getStoredStatItems(this.equipped),
			inventory: EquipmentData.getStoredStatItems(this.inventory),
			materials: EquipmentData.getStoredStatItems(this.materials),
		};
	}

	set stored(stored) {
		this.metal = stored?.metal || 0;
		this.equipped = EquipmentData.setStoredStatItems(stored?.equipped, Equipment) || [...Array(4)];
		this.inventory = EquipmentData.setStoredStatItems(stored?.inventory, Equipment) || [...Array(maxInventory)];
		this.materials = EquipmentData.setStoredStatItems(stored?.materials, Material) || [...Array(maxMaterials)];
	}

	static getStoredStatItems(statItems) {
		return statItems.map(statItem => (
			statItem && {
				type: statItem.type,
				name: statItem.name,
				stats: statItem.stats.map(EquipmentData.getStoredStat),
			}));
	}

	static setStoredStatItems(stored, StatItemClass) {
		return stored?.map(statItem =>
			statItem && new StatItemClass(statItem.type, statItem.name, statItem.stats.map(EquipmentData.setStoredStat)));
	}

	static getStoredStat(stat) {
		return {id: stat.id, value: stat.value};
	}

	static setStoredStat(stored) {
		return new Stat(stored.id, stored.value);
	}

	get emptyInventoryIndex() {
		return this.inventory.findIndex(equipment => !equipment);
	}

	get emptyMaterialIndex() {
		return this.materials.findIndex(material => !material);
	}

	getList(listType) {
		return [this.equipped, this.inventory, this.materials][listType];
	}

	forge(equipmentType) {
		let forgeCost = EquipmentData.getForgeCost(equipmentType);
		let index = this.emptyInventoryIndex;
		if (this.metal < forgeCost || index === -1)
			return;
		this.metal -= forgeCost;
		this.inventory[index] = new Equipment(equipmentType, EquipmentData.generateName(equipmentType), []);
		this.emit('change');
		this.emit('forge');
	}

	salvage(listType, index) {
		let equipmentList = this.getList(listType);
		if (!equipmentList[index])
			return;
		let metal = EquipmentData.getSalvageCost(equipmentList[index].type);
		this.metal += metal;
		equipmentList[index] = null;
		this.emit('change');
		this.emit('salvage', metal);
	}

	swapInventory(inventoryIndex1, inventoryIndex2) {
		if (!this.inventory[inventoryIndex1] && !this.inventory[inventoryIndex2])
			return;
		[this.inventory[inventoryIndex1], this.inventory[inventoryIndex2]] =
			[this.inventory[inventoryIndex2], this.inventory[inventoryIndex1]];
		this.emit('change');
	}

	equip(inventoryIndex) {
		if (!this.inventory[inventoryIndex])
			return;
		let equipmentType = this.inventory[inventoryIndex].type;
		[this.equipped[equipmentType], this.inventory[inventoryIndex]] =
			[this.inventory[inventoryIndex], this.equipped[equipmentType]];
		this.emit('change');
	}

	unequip(equipmentType, inventoryIndex) {
		if (this.inventory[inventoryIndex])
			inventoryIndex = this.emptyInventoryIndex;
		if (!this.equipped[equipmentType] || inventoryIndex === -1)
			return;
		[this.equipped[equipmentType], this.inventory[inventoryIndex]] =
			[this.inventory[inventoryIndex], this.equipped[equipmentType]];
		this.emit('change');
	}

	swapMaterial(materialIndex1, materialIndex2) {
		if (!this.materials[materialIndex1] && !this.materials[materialIndex2])
			return;
		[this.materials[materialIndex1], this.materials[materialIndex2]] =
			[this.materials[materialIndex2], this.materials[materialIndex1]];
		this.emit('change');
	}

	craft(listType, index, materialIndex) {
		let equipment = this.getList(listType)[index];
		if (!equipment || equipment.stats.length === 8)
			return;
		let material = this.materials[materialIndex];
		if (!material)
			return;
		let stats = material.stats.filter(stat => equipment.stats.every(statI => statI.id !== stat.id));
		if (!stats.length)
			return;
		let stat = stats[randInt(stats.length)];
		equipment.stats.push(stat);
		this.materials[materialIndex] = null;
		this.emit('change');
		this.emit('craft');
	}

	gainMaterial(material) {
		let index = this.emptyMaterialIndex;
		if (index === -1)
			return;
		this.materials[index] = material;
		this.emit('change');
	}

	static getForgeCost(equipmentType) {
		return [400, 200, 200, 200][equipmentType];
	}

	static getSalvageCost(equipmentType) {
		return EquipmentData.getForgeCost(equipmentType) / 2;
	}

	static generateName(equipmentType) {
		const prefixes = ['Magic', 'Enchanted', 'Secretive', 'Powerful', 'Robust', 'Large', 'Agile', 'Purple'];
		const suffixes = ['of Might', 'of Magic', 'of Power', 'of Speed'];
		let prefix = prefixes[randInt(prefixes.length)];
		let suffix = suffixes[randInt(suffixes.length)];
		let equipmentTypeName = ['Hull', 'Circuit', 'Thruster', 'Turret'][equipmentType];
		return `${prefix} ${equipmentTypeName} ${suffix}`;
	}
}

EquipmentData.ListTypes = ListTypes;

export default EquipmentData;
