import AimingLaserTurret from '../entities/monsters/mechanicalFaction/AimingLaserTurret.js';
import BombLayer from '../entities/monsters/mechanicalFaction/BombLayer.js';
import DashChaser from '../entities/monsters/mechanicalFaction/DashChaser.js';
import ExplodingTick from '../entities/monsters/mechanicalFaction/ExplodingTick.js';
import MechanicalBoss from '../entities/monsters/mechanicalFaction/MechanicalBoss.js';
import MechanicalBossEarly from '../entities/monsters/mechanicalFaction/MechanicalBossEarly.js';
import SniperTick from '../entities/monsters/mechanicalFaction/SniperTick.js';
import Static4DirTurret from '../entities/monsters/mechanicalFaction/Static4DirTurret.js';
import MapBoundary from '../entities/stills/MapBoundary.js';
import Rock from '../entities/stills/Rock.js';
import RockMineral from '../entities/stills/RockMineral.js';
import Text from '../painter/elements/Text.js';
import {Positions} from '../util/constants.js';
import Coordinate from '../util/Coordinate.js';
import {NoiseSimplex} from '../util/noise.js';
import {rand, round} from '../util/number.js';
import MapGenerator from './MapGenerator.js';

const WIDTH = 1.5, HEIGHT = 1.5;
const SPAWN_DIST = 3 / 4;

const STAGE_SPAWNS = [
	[
		[ExplodingTick, 1],
	],
	[
		[ExplodingTick, 2],
		[SniperTick, 2],
	],
	[
		[Static4DirTurret, 3],
		[AimingLaserTurret, 2],
	],
	[
		[ExplodingTick, 4],
		[SniperTick, 4],
		[Static4DirTurret, 2],
	],
	[
		[MechanicalBossEarly, 1],
	],
	[
		[BombLayer, 3],
		[DashChaser, 4],
	],
	[
		[AimingLaserTurret, 2],
		[BombLayer, 4],
		[DashChaser, 3],
	],
	[
		[SniperTick, 3],
		[Static4DirTurret, 3],
		[AimingLaserTurret, 3],
		[BombLayer, 3],
		[DashChaser, 3],
	],
	[
		[ExplodingTick, 4],
		[SniperTick, 4],
		[Static4DirTurret, 4],
		[AimingLaserTurret, 4],
		[BombLayer, 4],
		[DashChaser, 4],
	],
	[
		[MechanicalBoss, 1],
	],
	[
		[ExplodingTick, 4],
		[SniperTick, 4],
		[Static4DirTurret, 4],
		[AimingLaserTurret, 4],
		[BombLayer, 4],
		[DashChaser, 4],
	],
];

class MapGeneratorStaged extends MapGenerator {
	constructor(map, playerData) {
		super(map, playerData);

		this.occupiedNoise = new NoiseSimplex(2);
		this.rockNoise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.stageEntities = [];
		this.stage = 0;

		this.player.setPosition(WIDTH * SPAWN_DIST, HEIGHT * SPAWN_DIST);
		map.addPlayer(this.player);
		map.addUi(this);
	}

	update() {
		super.update();
		if (this.stageEntities.every(entity => entity.health.isEmpty())) {
			let entities = this.createMonsters(this.stage++);
			entities.forEach(([entity, ui]) => {
				while (!entity.checkPosition(this.map.intersectionFinder)) {
					let position = this.occupiedNoise.positions(1, WIDTH, HEIGHT)[0];
					entity.setPosition(...position);
				}
				this.map.addMonster(entity, ui);
			});
			this.player.restoreHealth();
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

	createMonsters(stage) {
		let spawns = STAGE_SPAWNS[Math.min(stage, STAGE_SPAWNS.length - 1)];
		let multiplier = Math.max(stage - STAGE_SPAWNS.length + 2, 1);
		return spawns.map(([MonsterClass, count]) =>
			[...Array(count * multiplier)]
				.map(() => [new MonsterClass(), false]))
			.flat();
	}

	paintUi(painter, camera) {
		painter.add(new Text(
			new Coordinate(1 - Positions.MARGIN, Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2)
				.align(Coordinate.Aligns.END, Coordinate.Aligns.START),
			`${this.stage} : ${round(this.timer / 100)}`));
	}
}

export default MapGeneratorStaged;

/*
123456

1
12
34
123

56
456
23456 - 1
124356

OR
123456
123456
123456
123456

1
12
34
123

456
2356
2456
13456

exploding tick          degen while moving
sniper tick             shot leaves temporary spheres in trail
fixed 4-way turret      alternates to diagonal
aiming 1-way turret     triple laser
bomb layer
charger

melee dart
melee dart spawner ship
degen turret or turret with spinning degen tiny mobs
turret with static & inactive tiny mobs, that periodically charge the player with slow rotation
wall of projectiles
frontal degen rectangle

melee slow debuff
ranged heal allies debuff
spinning turret
delayed missile turret
encircling circle fo bombs
rapid firing, slow moving, short range projectile machine gun

game modes: defense, boss fights, kill outpost portals, and arena
*/
