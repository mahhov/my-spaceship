import storage from '../util/storage.js';
import EncounterData from './EncounterData.js';
import EquipmentData from './EquipmentData.js';
import ExpData from './ExpData.js';
import RecordsData from './RecordsData.js';
import Stat from './Stat.js';
import StatValues from './StatValues.js';
import TechniqueData from './TechniqueData.js';
import TraitsData from './TraitsData.js';

class PlayerData {
	constructor() {
		this.expData = new ExpData();
		this.encounterData = new EncounterData();
		this.techniqueData = new TechniqueData(this.expData);
		this.traitsData = new TraitsData(this.expData);
		this.equipmentData = new EquipmentData();
		this.recordsData = new RecordsData(this.equipmentData);

		[
			this.expData,
			this.encounterData,
			this.techniqueData,
			this.traitsData,
			this.equipmentData,
			this.recordsData,
		].forEach(data => {
			data.stored = storage.getStored(data.constructor.name);
			data.on('change', () => storage.setStored(data.constructor.name, data.stored));
		});
	}

	get statValues() {
		let statValues = new StatValues();
		this.traitsData.allocations
			.forEach(allocation => statValues.addAllocation(allocation));
		this.equipmentData.equipped
			.filter(equipment => equipment)
			.forEach(equipment => statValues.addStatItem(equipment));
		return statValues;
	}

	get derivedStatValues() {
		let derivedStatValues = new StatValues();
		let statValues = this.statValues;
		// todo [medium] 80 should be a constant reused in Player.constructor()
		derivedStatValues.add(Stat.DerivedStatIds.TOTAL_LIFE, 80 * (1 + statValues.stats[Stat.Ids.LIFE]));
		return derivedStatValues;
	}

	getTechniqueStatValues(techniqueId) {
		let statValues = this.statValues;
		this.techniqueData.trees
			.find(tree => tree.id === techniqueId).allocationSets.flat()
			.forEach(allocation => statValues.addAllocation(allocation));
		return statValues;
	}
}

export default PlayerData;
