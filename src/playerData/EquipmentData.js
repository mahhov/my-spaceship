import Emitter from '../util/Emitter.js';
import makeEnum from '../util/enum.js';
import Equipment from './Equipment.js';

const EquipmentTypes = makeEnum({hull: 0, circuit: 0, thruster: 0, turret: 0});

const maxEquipments = 48, maxMaterials = 48;

class EquipmentData extends Emitter {
	constructor() {
		super();
		this.metal = 0;
		this.equipments = [...Array(maxEquipments)];
		this.materials = [...Array(maxMaterials)];
	}

	get stored() {
		return {
			metal: this.metal,
			equipments: this.equipments.map(equipment => (
				equipment && {
					type: equipment.type,
					name: equipment.name,
					stats: equipment.stats,
				})),
		};
	}

	set stored(stored) {
		this.metal = stored?.metal || 0;
		this.equipments = stored?.equipments?.map(equipment =>
			equipment && new Equipment(equipment.type, equipment.name, equipment.stats)) ||
			[...Array(maxEquipments)];
	}

	forge(equipmentType) {
		let forgeCost = EquipmentData.getForgeCost(equipmentType);
		let index = this.equipments.findIndex(equipment => !equipment);
		if (this.metal < forgeCost || index === -1)
			return;
		this.metal -= forgeCost;
		this.equipments[index] = new Equipment(equipmentType, EquipmentData.randomName, []);
		this.emit('change');
		this.emit('forge');
	}

	static getForgeCost(equipmentType) {
		return [400, 200, 200, 200][equipmentType];
	}

	static getSalvageCost(equipmentType) {
		return EquipmentData.getForgeCost(equipmentType) / 2;
	}

	static get randomName() {
		return 'yo';
	}
}

EquipmentData.EquipmentTypes = EquipmentTypes;

export default EquipmentData;
