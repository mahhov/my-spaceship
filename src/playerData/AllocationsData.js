import Emitter from '../util/Emitter.js';
import {clamp} from '../util/number.js';

class AllocationsData extends Emitter {
	constructor(expData, pointsPerLevel) {
		super();
		this.availablePoints = 0;
		expData.on('change-level', change => {
			this.availablePoints += change * pointsPerLevel;
			this.emit('change');
		});
	}

	get availableText() {
		return `Available points: ${this.availablePoints}`;
	}

	allocate(allocation, value) {
		value = clamp(value, -allocation.value, Math.min(this.availablePoints, allocation.maxValue - allocation.value));
		if (value) {
			allocation.value += value;
			this.availablePoints -= value;
			this.emit('change');
		}
	}
}

export default AllocationsData;
