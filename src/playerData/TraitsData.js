import Allocation from './Allocation.js';
import AllocationsData from './AllocationsData.js';
import Stat from './Stat.js';

class TraitsData extends AllocationsData {
	constructor(expData) {
		super(expData, 4);
		this.allocations = [
			new Allocation('Life', [
				new Stat(Stat.Ids.LIFE, .05),
			], 4),
			new Allocation('Heavy armor', [
				new Stat(Stat.Ids.ARMOR, .05),
				new Stat(Stat.Ids.MOVE_SPEED, -.05),
			], 4),
		];
	}

	get stored() {
		return {
			availablePoints: this.availablePoints,
			allocations: Object.fromEntries(this.allocations.map(allocation =>
				([allocation.name, allocation.value]))),
		};
	}

	set stored(stored) {
		this.availablePoints = stored?.availablePoints || 0;
		this.allocations.forEach(allocation =>
			allocation.value = stored?.allocations?.[allocation.name] || 0);
	}
}

export default TraitsData;
