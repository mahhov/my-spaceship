import Emitter from '../util/Emitter.js';

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
		if (allocation.value + value >= 0 && this.availablePoints - value >= 0 && allocation.value + value <= allocation.maxValue) {
			allocation.value += value;
			this.availablePoints -= value;
			this.emit('change');
		}
	}

	clear(allocation) {
		this.availablePoints += allocation.value;
		allocation.value = 0;
		this.emit('change');
	}
}

export default AllocationsData;
