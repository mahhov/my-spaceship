import Emitter from '../util/Emitter.js';
import makeEnum from '../util/enum.js';
import {randInt} from '../util/number.js';
import Equipment from './Equipment.js';

const EquipmentTypes = makeEnum({HULL: 0, CIRCUIT: 0, THRUSTER: 0, TURRET: 0});

const maxInventory = 48, maxMaterials = 48;

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
			equipped: this.equipped.map(equipment => (
				equipment && {
					type: equipment.type,
					name: equipment.name,
					stats: equipment.stats,
				})),
			inventory: this.inventory.map(equipment => (
				equipment && {
					type: equipment.type,
					name: equipment.name,
					stats: equipment.stats,
				})),
			// materials: this.materials.map(material => (
			// 	material && {
			// 		type: material.type,
			// 		name: material.name,
			// 		stats: material.stats,
			// 	})),
		};
	}

	set stored(stored) {
		this.metal = stored?.metal || 0;
		this.equipped = stored?.equipped?.map(equipment =>
			equipment && new Equipment(equipment.type, equipment.name, equipment.stats)) ||
			[...Array(4)];
		this.inventory = stored?.inventory?.map(equipment =>
			equipment && new Equipment(equipment.type, equipment.name, equipment.stats)) ||
			[...Array(maxInventory)];
		// this.materials = stored?.materials?.map(material =>
		// 	material && new Equipment(material.type, material.name, material.stats)) ||
		// 	[...Array(maxMaterials)];
	}

	get emptyInventoryIndex() {
		return this.inventory.findIndex(equipment => !equipment);
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

	salvage(inventoryIndex) {
		let metal = EquipmentData.getSalvageCost(this.inventory[inventoryIndex].type);
		this.metal += metal;
		this.inventory[inventoryIndex] = null;
		this.emit('change');
		this.emit('salvage', metal);
	}

	swapInventory(inventoryIndex1, inventoryIndex2) {
		[this.inventory[inventoryIndex1], this.inventory[inventoryIndex2]] =
			[this.inventory[inventoryIndex2], this.inventory[inventoryIndex1]];
		this.emit('change');
	}

	equip(equipmentType, inventoryIndex) {
		[this.equipped[equipmentType], this.inventory[inventoryIndex]] =
			[this.inventory[inventoryIndex], this.equipped[equipmentType]];
		this.emit('change');
	}

	swapMaterial(materialIndex1, materialIndex2) {
		[this.materials[materialIndex1], this.materials[materialIndex2]] =
			[this.materials[materialIndex2], this.materials[materialIndex1]];
		this.emit('change');
	}

	craft(inventoryIndex, materialIndex) {
		// let equipment = this.inventory[inventoryIndex];
		// let material = this.materials[materialIndex];
		// if (material.use(equipment)) {
		// 	this.materials[materialIndex] = null;
		// 	return true;
		// }
		this.emit('change');
		this.emit('craft');
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

EquipmentData.EquipmentTypes = EquipmentTypes;

export default EquipmentData;
