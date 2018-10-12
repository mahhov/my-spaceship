const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {rand, randInt, randVector} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Spawn extends Module {
	config(origin, range, probability, minCount, maxCount, monsterClass) {
		this.origin = origin;
		this.range = range;
		this.probability = probability;
		this.minCount = minCount;
		this.maxCount = maxCount;
		this.monsterClass = monsterClass;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		if (rand() > this.probability)
			return;

		let count = this.minCount + randInt(this.maxCount - this.minCount);
		for (let i = 0; i < count; i++) {
			let spawnVector = randVector(this.range);
			let monster = new this.monsterClass(this.origin.x + spawnVector[0], this.origin.y + spawnVector[1]);
			map.addMonster(monster);
		}
	}
}

Spawn.Stages = Stages;

module.exports = Spawn;
