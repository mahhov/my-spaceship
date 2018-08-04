const {rand} = require('../util/Number');
const Rock = require('../entities/Rock');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

const {NoiseSimplex} = require('../util/Noise');

const WIDTH = 10, HEIGHT = WIDTH;


class MapGenerator {

	static generateSample(map, player) {
		const ROCKS = 100, TURRETS = 100, SHOTGUN_WARRIORS = 100;
		const ROCK_MAX_SIZE = .1;

		let noise = new NoiseSimplex(5);

		player.setPosition(WIDTH / 2, HEIGHT * 3 / 4);
		map.addPlayer(player);

		noise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => map.addRock(new Rock(...position, rand(ROCK_MAX_SIZE))));
		noise.positions(TURRETS, WIDTH, HEIGHT).forEach(position => map.addMonster(new Turret(...position)));
		noise.positions(SHOTGUN_WARRIORS, WIDTH, HEIGHT).forEach(position => map.addMonster(new ShotgunWarrior(...position)));
		noise.positions(1, WIDTH, HEIGHT).forEach(position => map.addMonster(new Boss1(...position), true));
	}
}

MapGenerator.width = WIDTH;
MapGenerator.height = HEIGHT;

module.exports = MapGenerator;
