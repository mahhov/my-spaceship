import Emitter from '../util/Emitter.js';
import ZoneLayout from '../util/ZoneLayout.js';

class EncounterData extends Emitter {
	constructor() {
		super();
		this.zoneLayout = new ZoneLayout();
	}

	get stored() {
		return {
			zoneLayout: {
				grid: this.zoneLayout.grid,
				completed: this.zoneLayout.completed,
			},
		};
	}

	set stored(stored) {
		let grid = stored?.zoneLayout?.grid;
		let completed = stored?.zoneLayout?.completed;
		this.zoneLayout = new ZoneLayout(grid, completed);
	}
}

export default EncounterData;
