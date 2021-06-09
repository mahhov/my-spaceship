import storage from '../util/storage.js';
import SkillsData from './SkillsData.js';

class PlayerData {
	constructor() {
		this.skillsData = new SkillsData();
		this.skillsData.stored = storage.getStored('skillsData');
		this.skillsData.on('change', () => storage.setStored('skillsData', this.skillsData.stored));
	}
}

export default PlayerData;
