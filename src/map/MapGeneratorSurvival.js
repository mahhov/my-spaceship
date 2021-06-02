import MapGenerator from './MapGenerator.js';
import {NoiseSimplex} from '../util/Noise.js';
import Player from '../entities/heroes/Player.js';
import {rand, round} from '../util/Number.js';
import MapBoundary from '../entities/stills/MapBoundary.js';
import Rock from '../entities/stills/Rock.js';
import RockMineral from '../entities/stills/RockMineral.js';
import OutpostPortal from '../entities/monsters/OutpostPortal.js';
import Turret from '../entities/monsters/Turret.js';
import ShotgunWarrior from '../entities/monsters/ShotgunWarrior.js';
import Boss1 from '../entities/monsters/Boss1.js';
import {Positions} from '../util/Constants.js';
import Coordinate from '../util/Coordinate.js';
import Text from '../painter/elements/Text.js';

const WIDTH = 1.5, HEIGHT = 1.5;

class MapGeneratorSurvival extends MapGenerator {
	constructor(map) {
		super(map);

		this.occupiedNoise = new NoiseSimplex(2);
		this.rockNoise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.stageEntities = [];
		this.stage = 0;

		this.player = Player.defaultConstructor();
		this.player.setPosition(...this.rockNoise.positionsLowest(100, WIDTH, HEIGHT));
		map.addPlayer(this.player);
		map.addUi(this);
	}

	update() {
		super.update();
		if (this.stageEntities.every(entity => entity.health.isEmpty())) {
			this.timerDamageMultiplier = this.timer / 5000 + 1;
			let entities = [
				...this.generateOutputs(++this.stage, 1 / 3, this.timerDamageMultiplier),
				...this.generateMonsters(0, 0, this.stage && this.stage % 5 === 0)]; // every 5 stages, starting at stage 5
			entities.forEach(([entity, ui]) => this.map.addMonster(entity, ui));
			this.stageEntities = entities.map(([entity]) => entity);
		}
	}

	generateBoundaries() {
		MapBoundary.createBoxBoundaries(WIDTH, HEIGHT).forEach(mapBoundary => this.map.addStill(mapBoundary));
	}

	generateRocks() {
		const ROCKS = 3, ROCK_MINERALS = 1;
		const ROCK_MAX_SIZE = .3;
		this.rockNoise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new Rock(...position, rand(ROCK_MAX_SIZE))));
		this.rockNoise.positions(ROCK_MINERALS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new RockMineral(...position, rand(ROCK_MAX_SIZE))));
	}

	* generateOutputs(outpostCount, turretProbability, damageMultiplier) {
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

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			new Coordinate(1 - Positions.MARGIN, Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2).align(Coordinate.Aligns.END, Coordinate.Aligns.START),
			`Stage: ${this.stage}`, font));
		painter.add(new Text(
			new Coordinate(1 - Positions.MARGIN, Positions.MARGIN * 2.5 + Positions.BAR_HEIGHT * 2 + Positions.STAGE_TEXT_HEIGHT).align(Coordinate.Aligns.END, Coordinate.Aligns.START),
			`Difficulty: ${round(this.timerDamageMultiplier, 2)}`, font));
	}
}

export default MapGeneratorSurvival;

// todo [medium] don't spawn things intersecting other things
// todo [medium] don't spawn close to player
