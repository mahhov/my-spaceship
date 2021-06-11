import storage from '../util/storage.js';
import RecordsData from './RecordsData.js';
import TraitsData from './TraitsData.js';

class PlayerData {
	constructor() {
		this.traitsData = new TraitsData();
		this.traitsData.stored = storage.getStored('traitsData');
		this.traitsData.on('change', () => storage.setStored('traitsData', this.traitsData.stored));

		this.recordsData = new RecordsData();
		this.recordsData.stored = storage.getStored('recordsData');
		this.recordsData.on('change', () => storage.setStored('recordsData', this.recordsData.stored));
	}
}

export default PlayerData;
