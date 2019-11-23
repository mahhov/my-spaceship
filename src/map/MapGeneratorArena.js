const {NoiseSimplex} = require('../util/Noise');
const {rand, round} = require('../util/Number');
const MapBoundary = require('../entities/MapBoundary');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const Champion = require('../entities/monsters/Champion');
const ExplodingTick = require('../entities/monsters/mechanicalFaction/ExplodingTick');
const SniperTick = require('../entities/monsters/mechanicalFaction/SniperTick');
const Static4DirTurret = require('../entities/monsters/mechanicalFaction/Static4DirTurret');
const AimingLaserTurret = require('../entities/monsters/mechanicalFaction/AimingLaserTurret');
const BombLayer = require('../entities/monsters/mechanicalFaction/BombLayer');
const DashChaser = require('../entities/monsters/mechanicalFaction/DashChaser');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

const WIDTH = 1.5, HEIGHT = 1.5;
const SPAWN_DIST = 3 / 4;

const STAGE_SPAWNS = [
	[
		[DashChaser, 1],
	],
	[
		[ExplodingTick, 3],
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
	// boss 1
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

	// boss 2
];

class MapGeneratorArena {
	constructor(map, player) {
		const OCCUPIED_NOISE = 2, ROCK_NOISE = 5;

		this.occupiedNoise = new NoiseSimplex(OCCUPIED_NOISE);
		this.rockNoise = new NoiseSimplex(ROCK_NOISE);

		this.map = map;
		this.player = player;
	}

	generate() {
		this.map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
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
			let entities = this.createMonsters(this.stage++);
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

	createMonsters(stage) {
		let spawns = STAGE_SPAWNS[Math.min(stage, STAGE_SPAWNS.length - 1)];
		let multiplier = Math.max(stage - STAGE_SPAWNS.length + 2, 1);
		return spawns.map(([MonsterClass, count]) =>
			this.occupiedNoise.positions(count * multiplier, WIDTH, HEIGHT)
				.map(position => [new MonsterClass(...position), false]))
			.flat();
	}

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2,
			`${this.stage} : ${round(this.timer / 100)}`, font));
	}
}

module.exports = MapGeneratorArena;

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
