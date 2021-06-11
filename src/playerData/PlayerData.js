import storage from '../util/storage.js';
import ExpData from './ExpData.js';
import RecordsData from './RecordsData.js';
import Stat from './Stat.js';
import TraitsData from './TraitsData.js';

class PlayerData {
	constructor() {
		this.expData = new ExpData();
		this.traitsData = new TraitsData(this.expData);
		this.recordsData = new RecordsData();

		[
			this.expData,
			this.traitsData,
			this.recordsData,
		].forEach(data => {
			data.stored = storage.getStored(data.constructor.name);
			data.on('change', () => storage.setStored(data.constructor.name, data.stored));
		});
	}

	get statValues() {
		let statValues = [];
		this.traitsData.traitItems.forEach(traitItem =>
			traitItem.stats.forEach(stat => {
				statValues[stat.id] ||= 0;
				statValues[stat.id] += traitItem.value * stat.value;
			}));
		return statValues;
	}

	get derivedStatValues() {
		let derivedStatValues = [];
		let statValues = this.statValues;
		// todo [medium] 80 should be a constant reused in Player.constructor()
		derivedStatValues[Stat.DerivedStatIds.TOTAL_LIFE] = 80 * (1 + statValues[Stat.Ids.LIFE]);
		return derivedStatValues;
	}
}

export default PlayerData;
