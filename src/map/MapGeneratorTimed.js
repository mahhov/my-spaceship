const {NoiseSimplex} = require('../util/Noise');
const {clamp, rand, round} = require('../util/Number');
const MapBoundary = require('../entities/MapBoundary');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const Champion = require('../entities/monsters/Champion');
const ExplodingTick = require('../entities/monsters/mechanicalFaction/ExplodingTick');
const SniperTick = require('../entities/monsters/mechanicalFaction/SniperTick');
const Static4DirTurret = require('../entities/monsters/mechanicalFaction/Static4DirTurret');
const AimingLaserTurret = require('../entities/monsters/mechanicalFaction/AimingLaserTurret');
const MechanicalBossEarly = require('../entities/monsters/mechanicalFaction/MechanicalBossEarly');
const BombLayer = require('../entities/monsters/mechanicalFaction/BombLayer');
const DashChaser = require('../entities/monsters/mechanicalFaction/DashChaser');
const MechanicalBoss = require('../entities/monsters/mechanicalFaction/MechanicalBoss');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

const WIDTH = 1.5, HEIGHT = 1.5;
const SPAWN_DIST = 3 / 4;

const SPAWNS = [
	{
		monsterClass: ExplodingTick,
		rampStart: 0,
		rampEnd: 1,
		weight: 30,
	},
	{
		monsterClass: SniperTick,
		rampStart: 6,
		rampEnd: 10,
		weight: 20,
	},
	{
		monsterClass: Static4DirTurret,
		rampStart: 8,
		rampEnd: 12,
		weight: 10,
	},
	{
		monsterClass: AimingLaserTurret,
		rampStart: 10,
		rampEnd: 14,
		weight: 10,
	},
	{
		monsterClass: MechanicalBossEarly,
		rampStart: 12,
		rampEnd: 20,
		weight: 1,
	},
	{
		monsterClass: BombLayer,
		rampStart: 16,
		rampEnd: 20,
		weight: 10,
	},
	{
		monsterClass: DashChaser,
		rampStart: 18,
		rampEnd: 22,
		weight: 10,
	},
	{
		monsterClass: MechanicalBoss,
		rampStart: 20,
		rampEnd: 29,
		weight: .3,
	},
];

class MapGeneratorTimed {
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

		this.timer = 0;
		this.weightAccumulated = 0;
		this.pendingMonsters = [];

		this.player.setPosition(WIDTH * SPAWN_DIST, HEIGHT * SPAWN_DIST);
		this.map.addPlayer(this.player);
		this.map.addUi(this);
	}

	update() {
		this.timer++;
		this.pendingMonsters.push(...this.createMonsters());
		while (this.pendingMonsters.length) {
			let [entity, ui] = this.pendingMonsters[0];
			let foundPosition;
			for (let tryI = 0; tryI < 3 && !foundPosition; tryI++) {
				let position = this.occupiedNoise.positions(1, WIDTH, HEIGHT)[0];
				entity.setPosition(...position);
				foundPosition = entity.checkPosition(this.map.intersectionFinder);
			}
			if (!foundPosition)
				return;
			this.map.addMonster(entity, ui);
			this.pendingMonsters.pop();
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

	createMonsters() {
		let stage = this.timer / 100;
		let spawnEvery = .9 ** (stage / 10) * 20;
		this.weightAccumulated += rand(1 / spawnEvery);
		let weights = SPAWNS.map(spawn =>
			clamp((stage - spawn.rampStart) / (spawn.rampEnd - spawn.rampStart), 0, 1) * spawn.weight);
		let weightsSum = weights.reduce((sum, weight) => sum + weight);
		let spawns = [];
		while (this.weightAccumulated > 1) {
			this.weightAccumulated--;
			let spawnPick = rand(weightsSum);
			let spawnIndex = weights.findIndex(weight => {
				spawnPick -= weight;
				return spawnPick < 0;
			});
			if (spawnIndex >= 0)
				spawns.push([new SPAWNS[spawnIndex].monsterClass(), false]);
		}
		return spawns;
	}

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2,
			`${round(this.timer / 100)}`, font));
	}
}

module.exports = MapGeneratorTimed;

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
