import storage from '../util/storage.js';
import ExpData from './ExpData.js';
import RecordsData from './RecordsData.js';
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
}

export default PlayerData;
