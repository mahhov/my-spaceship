const {NoiseSimplex} = require('../util/Noise');
const {rand} = require('../util/Number');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const OutpostPortal = require('../entities/monsters/OutpostPortal');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

const WIDTH = 10, HEIGHT = 10;

class MapGenerator {
	constructor(map, player) {
		const OCCUPIED_NOISE = 2, ROCK_NOISE = 5;

		this.occupiedNoise = new NoiseSimplex(OCCUPIED_NOISE);
		this.rockNoise = new NoiseSimplex(ROCK_NOISE);

		this.map = map;
		this.player = player;
	}

	generateSample() {
		this.map.setSize(WIDTH, HEIGHT);

		this.generateRocks();
		this.generateOutputs();
		this.generateMonsters();

		this.player.setPosition(...this.rockNoise.positionsLowest(100, WIDTH, HEIGHT));
		this.map.addPlayer(this.player);

	}

	generateRocks() {
		const ROCKS = 500, ROCK_MINERALS = 100;
		const ROCK_MAX_SIZE = .1;
		this.rockNoise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new Rock(...position, rand(ROCK_MAX_SIZE))));
		this.rockNoise.positions(ROCK_MINERALS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new RockMineral(...position, rand(ROCK_MAX_SIZE))));
	}

	generateOutputs() {
		const OUTPOSTS = 20;
		this.occupiedNoise.positions(OUTPOSTS, WIDTH, HEIGHT).forEach(position => {
			this.map.addMonster(new OutpostPortal(...position));
		});
	}

	generateMonsters() {
		const TURRETS = 0, SHOTGUN_WARRIORS = 0;
		// noise.positions(TURRETS, WIDTH, HEIGHT).forEach(position => this.map.addMonster(new Turret(...position)));
		// noise.positions(SHOTGUN_WARRIORS, WIDTH, HEIGHT).forEach(position => this.map.addMonster(new ShotgunWarrior(...position)));
		// noise.positions(1, WIDTH, HEIGHT).forEach(position => this.map.addMonster(new Boss1(...position), true));
	}
}

module.exports = MapGenerator;
