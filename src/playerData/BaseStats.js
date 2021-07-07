class BaseStats {
	constructor(tuples) {
		// tuples should be formatted {[statId: [valueAtX1, initialX], ...}
		// E.g., if valueAtX1 = 80, and initialX = 1, and statValue is .5, then basedStat is 80 * (1 + .5)
		this.tuples = tuples;
	}

	getBasedStat(statId, statValue) {
		let base = this.tuples[statId];
		return base[0] * (base[1] + statValue);
	}
}

export default BaseStats;
