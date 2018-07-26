const Rock = require('../entities/Rock');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

class MapGenerator {
	static generateSample(map, player) {
		const ROCKS = 5, TURRETS = 5, SHOTGUN_WARRIORS = 5;

		for (let i = 0; i < ROCKS; i++)
			map.addRock(new Rock(Math.random(), Math.random(), Math.random() * .1, Math.random() * .1));

		map.addPlayer(player);

		for (let i = 0; i < TURRETS; i++)
			map.addMonster(new Turret(Math.random(), Math.random()))

		for (let i = 0; i < SHOTGUN_WARRIORS; i++)
			map.addMonster(new ShotgunWarrior(Math.random(), Math.random()))

		map.addMonster(new Boss1(.5, .25), true);
	}
}

module.exports = MapGenerator;
