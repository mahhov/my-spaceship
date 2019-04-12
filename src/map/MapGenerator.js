const {NoiseSimplex} = require('../util/Noise');
const {rand, randInt} = require('../util/Number');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const OutpostPortal = require('../entities/monsters/OutpostPortal');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

const WIDTH = 2, HEIGHT = 2;

class MapGenerator {
	constructor(map, player) {
		const OCCUPIED_NOISE = 2, ROCK_NOISE = 5;

		this.occupiedNoise = new NoiseSimplex(OCCUPIED_NOISE);
		this.rockNoise = new NoiseSimplex(ROCK_NOISE);

		this.map = map;
		this.player = player;
	}

	generate() {
		this.map.setSize(WIDTH, HEIGHT);

		this.generateRocks();
		// this.generateMonsters();

		this.stageEntities = [];
		this.generateStage = 0;

		this.player.setPosition(...this.rockNoise.positionsLowest(100, WIDTH, HEIGHT));
		this.map.addPlayer(this.player);
	}

	update() {
		if (this.stageEntities.every(entity => entity.health.isEmpty()))
			this.stageEntities = this.generateOutputs(++this.generateStage, 1 / 3);
	}

	generateRocks() {
		// const ROCKS = 17, ROCK_MINERALS = 5;
		const ROCKS = 0, ROCK_MINERALS = 0;
		const ROCK_MAX_SIZE = .3;
		this.rockNoise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new Rock(...position, rand(ROCK_MAX_SIZE))));
		this.rockNoise.positions(ROCK_MINERALS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new RockMineral(...position, rand(ROCK_MAX_SIZE))));
	}

	generateOutputs(outpostCount, turretProbability) {
		let generated = [];
		this.occupiedNoise.positions(outpostCount, WIDTH, HEIGHT).forEach(position => {
			let outpostPortal = new OutpostPortal(...position);
			generated.push(outpostPortal);
			this.map.addMonster(outpostPortal);
			if (rand() < turretProbability)
				this.occupiedNoise.positions(1, WIDTH, HEIGHT).forEach(position => {
					let turret = new Turret(...position);
					generated.push(turret);
					this.map.addMonster(turret);
				});
		});
		return generated;
	}

	generateMonsters() {
		const TURRETS = 0, SHOTGUN_WARRIORS = 0;
		this.occupiedNoise.positions(TURRETS, WIDTH, HEIGHT).forEach(position => this.map.addMonster(new Turret(...position)));
		this.occupiedNoise.positions(SHOTGUN_WARRIORS, WIDTH, HEIGHT).forEach(position => this.map.addMonster(new ShotgunWarrior(...position)));
		this.occupiedNoise.positions(1, WIDTH, HEIGHT).forEach(position => this.map.addMonster(new Boss1(...position), true));
	}
}

module.exports = MapGenerator;

// todo [medium] don't spawn things intersecting other things
