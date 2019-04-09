const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const LinkedList = require('../../util/LinkedList');
const {rand, randInt, randVector} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Spawn extends Module {
	config(origin, range, probability, minCount, maxCount, spawnLimit, monsterClass) {
		this.origin = origin;
		this.range = range;
		this.minCount = minCount;
		this.maxCount = maxCount;
		this.spawnLimit = spawnLimit;
		this.monsterClass = monsterClass;

		this.spawns = new LinkedList();
		this.probabilityRate = 2 * probability * probability; // integral(2p^2 t dt)_0_1/p = 1
		this.sinceLastSpawn = 0;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			return;

		if (rand() > this.sinceLastSpawn * this.probabilityRate) {
			this.sinceLastSpawn++;
			return;
		}
		this.sinceLastSpawn = 0;

		this.spawns.forEach((spawn, iter) => {
			if (spawn.health.isEmpty())
				this.spawns.remove(iter);
		});

		let count = Math.min((this.minCount + randInt(this.maxCount - this.minCount)), this.spawnLimit - this.spawns.length);
		for (let i = 0; i < count; i++) {
			let spawnVector = randVector(this.range);
			let monster = new this.monsterClass(this.origin.x + spawnVector[0], this.origin.y + spawnVector[1]);
			this.spawns.add(monster);
			map.addMonster(monster);
		}
	}
}

Spawn.Stages = Stages;

module.exports = Spawn;
