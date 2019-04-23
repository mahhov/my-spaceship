const {NoiseSimplex} = require('../util/Noise');
const {rand, randInt, round} = require('../util/Number');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const OutpostPortal = require('../entities/monsters/OutpostPortal');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

const WIDTH = 1.5, HEIGHT = 1.5;

class MapGeneratorSurvival {
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
		this.stage = 0;
		this.timer = 0;

		this.player.setPosition(...this.rockNoise.positionsLowest(100, WIDTH, HEIGHT));
		this.map.addPlayer(this.player);
		this.map.addUi(this);
	}

	update() {
		this.timer++;
		if (this.stageEntities.every(entity => entity.health.isEmpty())) {
			this.timerDamageMultiplier = this.timer / 5000 + 1;
			let entities = [
				...this.generateOutputs(++this.stage, 1 / 3, this.timerDamageMultiplier),
				...this.generateMonsters(0, 0, this.stage && this.stage % 5 === 0)]; // every 5 stages, starting at stage 5
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

	* generateOutputs(outpostCount, turretProbability, damageMultiplier) {
		let generated = [];
		for (let position of this.occupiedNoise.positions(outpostCount, WIDTH, HEIGHT)) {
			let outpostPortal = new OutpostPortal(...position, this.timerDamageMultiplier);
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

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2,
			`Stage: ${this.stage}`, font));
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2.5 + Positions.BAR_HEIGHT * 2 + Positions.STAGE_TEXT_HEIGHT,
			`Difficulty ${round(this.timerDamageMultiplier, 2)}`, font));
	}
}

module.exports = MapGeneratorSurvival;

// todo [medium] don't spawn things intersecting other things