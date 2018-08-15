const {rand} = require('../util/Number');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

const {NoiseSimplex} = require('../util/Noise');

const WIDTH = 10, HEIGHT = WIDTH;

class MapGenerator {

	static generateSample(map, player) {
		const ROCKS = 500, ROCK_MINERALS = 100, TURRETS = 0, SHOTGUN_WARRIORS = 0;
		const ROCK_MAX_SIZE = .1;

		let noise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		player.setPosition(...noise.positionsLowest(100, WIDTH, HEIGHT));
		map.addPlayer(player);

		noise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => map.addStill(new Rock(...position, rand(ROCK_MAX_SIZE))));
		noise.positions(ROCK_MINERALS, WIDTH, HEIGHT).forEach(position => map.addStill(new RockMineral(...position, rand(ROCK_MAX_SIZE))));
		noise.positions(TURRETS, WIDTH, HEIGHT).forEach(position => map.addMonster(new Turret(...position)));
		noise.positions(SHOTGUN_WARRIORS, WIDTH, HEIGHT).forEach(position => map.addMonster(new ShotgunWarrior(...position)));
		noise.positions(1, WIDTH, HEIGHT).forEach(position => map.addMonster(new Boss1(...position), true));
	}
}

module.exports = MapGenerator;
