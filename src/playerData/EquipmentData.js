import Emitter from '../util/Emitter.js';
import {randInt} from '../util/number.js';
import Equipment from './Equipment.js';
import Material from './Material.js';
import Stat from './Stat.js';

const maxInventory = 128, maxMaterials = 128;

class EquipmentData extends Emitter {
	constructor() {
		super();
		this.metal = 0;
		this.equipped = [...Array(4)];
		this.inventory = [...Array(maxInventory)];
		this.materials = [...Array(maxMaterials)];

		this.materials = this.materials.map(m => m ||
			new Material(Material.Types.A, 'mat a', [
				new Stat(Stat.Ids.LIFE, 10),
				new Stat(Stat.Ids.ATTACK_RANGE, 10),
				new Stat(Stat.Ids.MOVE_SPEED, 10),
			]));
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
			materials: this.materials.map(material => (
				material && {
					type: material.type,
					name: material.name,
					stats: material.stats,
				})),
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
		this.materials = stored?.materials?.map(material =>
			material && new Material(material.type, material.name, material.stats)) ||
			[...Array(maxMaterials)];
	}

	get emptyInventoryIndex() {
		return this.inventory.findIndex(equipment => !equipment);
	}

	getEquipmentList(equipped) {
		return equipped ? this.equipped : this.inventory;
	}

	forge(equipmentType) {
		// todo [high] make other methods similarly robust and remove checks from ui
		let forgeCost = EquipmentData.getForgeCost(equipmentType);
		let index = this.emptyInventoryIndex;
		if (this.metal < forgeCost || index === -1)
			return;
		this.metal -= forgeCost;
		this.inventory[index] = new Equipment(equipmentType, EquipmentData.generateName(equipmentType), []);
		this.emit('change');
		this.emit('forge');
	}

	salvage(equipped, inventoryIndex) {
		let equipmentList = this.getEquipmentList(equipped);
		let metal = EquipmentData.getSalvageCost(equipmentList[inventoryIndex].type);
		this.metal += metal;
		equipmentList[inventoryIndex] = null;
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

	craft(equipped, inventoryIndex, materialIndex) {
		let equipment = this.getEquipmentList(equipped)[inventoryIndex];
		if (equipment.stats.length === 8)
			return;
		let material = this.materials[materialIndex];
		let stats = material.stats.filter(stat => equipment.stats.every(statI => statI.id !== stat.id));
		if (!stats.length)
			return;
		let stat = stats[randInt(stats.length)];
		equipment.stats.push(stat);
		this.materials[materialIndex] = null;
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

export default EquipmentData;
