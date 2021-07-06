class BaseStats {
	constructor(tuples) {
		// tuples should be formatted {[statId: [valueAtX1, initialX], ...}
		// E.g., if valueAtX1 = 80, and initialX = 1, and stat is .5, then basedStat is 80 * (1 + .5)
		this.tuples = tuples;
	}
}

export default BaseStats;
