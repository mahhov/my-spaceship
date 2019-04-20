const {NoiseSimplex} = require('../util/Noise');
const {rand} = require('../util/Number');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const Champion = require('../entities/monsters/Champion');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

const WIDTH = 1.5, HEIGHT = 1.5;
const SPAWN_DIST = 3 / 4;

class MapGeneratorArena {
	constructor(map, player) {
		const OCCUPIED_NOISE = 2, ROCK_NOISE = 5;

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

		this.player.setPosition(WIDTH * SPAWN_DIST, HEIGHT * SPAWN_DIST);
		this.map.addPlayer(this.player);
		this.map.addUi(this);
	}

	update() {
		this.timer++;
		if (this.stageEntities.every(entity => entity.health.isEmpty())) {
			let entities = [this.createEnemyChampion()];
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

	createEnemyChampion() {
		return [new Champion(WIDTH * (1 - SPAWN_DIST), HEIGHT * (1 - SPAWN_DIST)), true];
	}

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2,
			`${this.timer / 100}`, font));
	}
}

module.exports = MapGeneratorArena;
