const {NoiseSimplex} = require('../util/Noise');
const {rand, randInt} = require('../util/Number');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const OutpostPortal = require('../entities/monsters/OutpostPortal');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

const WIDTH = 1.5, HEIGHT = 1.5;

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

		this.stageEntities = [];
		this.generateStage = 0;
		this.timer = 0;

		this.player.setPosition(...this.rockNoise.positionsLowest(100, WIDTH, HEIGHT));
		this.map.addPlayer(this.player);
	}

	update() {
		this.timer++;
		if (this.stageEntities.every(entity => entity.health.isEmpty())) {
			let entities = [
				...this.generateOutputs(++this.generateStage, 1 / 3, this.timer),
				...this.generateMonsters(0, 0, this.generateStage && this.generateStage % 5 === 0)]; // every 5 stages, starting at stage 5
			entities.forEach(([entity, ui]) => this.map.addMonster(entity, ui));
			this.stageEntities = entities.map(([entity]) => entity);
		}
	}

	generateRocks() {
		// const ROCKS = 17, ROCK_MINERALS = 5;
		const ROCKS = 0, ROCK_MINERALS = 0;
		const ROCK_MAX_SIZE = .3;
		this.rockNoise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new Rock(...position, rand(ROCK_MAX_SIZE))));
		this.rockNoise.positions(ROCK_MINERALS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new RockMineral(...position, rand(ROCK_MAX_SIZE))));
	}

	* generateOutputs(outpostCount, turretProbability, timer) {
		let generated = [];
		for (let position of this.occupiedNoise.positions(outpostCount, WIDTH, HEIGHT)) {
			let outpostPortal = new OutpostPortal(...position, (timer / 5000 + 1));
			yield [outpostPortal];
			if (rand() < turretProbability)
				for (let tPosition of this.occupiedNoise.positions(1, WIDTH, HEIGHT))
					yield  [new Turret(...tPosition)];
		}
	}

	* generateMonsters(turretCount, shotgunCount, bossCount) {
		let position;
		for (position of this.occupiedNoise.positions(turretCount, WIDTH, HEIGHT))
			yield [new Turret(...position)];
		for (position of this.occupiedNoise.positions(shotgunCount, WIDTH, HEIGHT))
			yield [new ShotgunWarrior(...position)];
		for (position of this.occupiedNoise.positions(bossCount, WIDTH, HEIGHT))
			yield [new Boss1(...position), true];
	}
}

module.exports = MapGenerator;

// todo [medium] don't spawn things intersecting other things
