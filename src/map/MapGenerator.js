const {rand} = require('../util/Number');
const Rock = require('../entities/Rock');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

class MapGenerator {
	static generateSample(map, player) {
		const WIDTH = 5, HEIGHT = 5;
		const ROCKS = 5, TURRETS = 5, SHOTGUN_WARRIORS = 5;
		const ROCK_MAX_SIZE = .1;

		for (let i = 0; i < ROCKS; i++)
			map.addRock(new Rock(rand(WIDTH), rand(HEIGHT), rand(ROCK_MAX_SIZE), rand(ROCK_MAX_SIZE)));

		player.setPosition(WIDTH / 2, HEIGHT * 3 / 4);
		map.addPlayer(player);

		for (let i = 0; i < TURRETS; i++)
			map.addMonster(new Turret(rand(WIDTH), rand(HEIGHT)))

		for (let i = 0; i < SHOTGUN_WARRIORS; i++)
			map.addMonster(new ShotgunWarrior(rand(WIDTH), rand(HEIGHT)))

		map.addMonster(new Boss1(WIDTH / 2, HEIGHT / 4), true);
	}
}

module.exports = MapGenerator;
