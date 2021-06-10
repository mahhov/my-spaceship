import storage from '../util/storage.js';
import TraitsData from './TraitsData.js';

class PlayerData {
	constructor() {
		this.traitsData = new TraitsData();
		this.traitsData.stored = storage.getStored('traitsData');
		this.traitsData.on('change', () => storage.setStored('traitsData', this.traitsData.stored));
	}
}

export default PlayerData;
