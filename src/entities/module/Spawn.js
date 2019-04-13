const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const LinkedList = require('../../util/LinkedList');
const {rand, randInt, randVector} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
const Phases = makeEnum('NOT_SPAWNING', 'SPAWNING', 'COMPLETE');

class Spawn extends ModuleManager {
	config(origin, range, probability, minCount, maxCount, concurrentSpawnLimit, totalSpawnLimit, monsterClass, ...monsterConstructorParams) {
		this.origin = origin;
		this.range = range;
		this.minCount = minCount;
		this.maxCount = maxCount;
		this.concurrentSpawnLimit = concurrentSpawnLimit;
		this.totalSpawnLimit = totalSpawnLimit;
		this.monsterConstructorParams = monsterConstructorParams;
		this.monsterClass = monsterClass;

		this.spawns = new LinkedList();
		this.totalSpawnCount = 0;
		this.probabilityRate = 2 * probability * probability; // integral(2p^2 t dt)_0_1/p = 1
		this.sinceLastSpawn = 0;
	}

	managerApply(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE || this.phase === Phases.COMPLETE) {
			if (this.phase === Phases.SPAWNING)
				this.modulesSetStage(Phases.NOT_SPAWNING);
			return;
		} else
			this.modulesSetStage(Phases.SPAWNING);

		if (rand() > this.sinceLastSpawn * this.probabilityRate) {
			this.sinceLastSpawn++;
			return;
		}
		this.sinceLastSpawn = 0;

		this.spawns.forEach((spawn, iter) => {
			if (spawn.health.isEmpty())
				this.spawns.remove(iter);
		});

		let count = Math.min(
			(this.minCount + randInt(this.maxCount - this.minCount)),
			this.concurrentSpawnLimit - this.spawns.length,
			this.totalSpawnLimit - this.totalSpawnCount);
		for (let i = 0; i < count; i++) {
			let spawnVector = randVector(this.range);
			let monster = new this.monsterClass(this.origin.x + spawnVector[0], this.origin.y + spawnVector[1], ...this.monsterConstructorParams);
			this.spawns.add(monster);
			this.totalSpawnCount++;
			map.addMonster(monster);
		}
		if (this.totalSpawnLimit === this.totalSpawnCount)
			this.modulesSetStage(Phases.COMPLETE);
	}
}

Spawn.Stages = Stages;
Spawn.Phases = Phases;

module.exports = Spawn;


// todo outposts to be less tanky, more to spawn, further reduced tankyness after spawn limit reached
// todo spawned monsters to increase damage with time
// todo game modes defense, boss fights, kill outpost portals, and arena
// todo ability variety
