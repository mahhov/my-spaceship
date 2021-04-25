import MapGenerator from './MapGenerator.js';
import {NoiseSimplex} from '../util/Noise.js';
import Player from '../entities/heroes/Player.js';
import {clamp, rand} from '../util/Number.js';
import MapBoundary from '../entities/stills/MapBoundary.js';
import Rock from '../entities/stills/Rock.js';
import RockMineral from '../entities/stills/RockMineral.js';
import Champion from '../entities/monsters/Champion.js';
import ExplodingTick from '../entities/monsters/mechanicalFaction/ExplodingTick.js';
import SniperTick from '../entities/monsters/mechanicalFaction/SniperTick.js';
import Static4DirTurret from '../entities/monsters/mechanicalFaction/Static4DirTurret.js';
import AimingLaserTurret from '../entities/monsters/mechanicalFaction/AimingLaserTurret.js';
import MechanicalBossEarly from '../entities/monsters/mechanicalFaction/MechanicalBossEarly.js';
import BombLayer from '../entities/monsters/mechanicalFaction/BombLayer.js';
import DashChaser from '../entities/monsters/mechanicalFaction/DashChaser.js';
import MechanicalBoss from '../entities/monsters/mechanicalFaction/MechanicalBoss.js';

const WIDTH = 1.5, HEIGHT = 1.5;
const SPAWN_DIST = 3 / 4;

const SPAWNS = [
	{
		monsterClass: ExplodingTick,
		rampStart: 2,
		rampEnd: 3,
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
		rampStart: 16,
		rampEnd: 24,
		weight: 10,
	},
	{
		monsterClass: AimingLaserTurret,
		rampStart: 20,
		rampEnd: 28,
		weight: 10,
	},
	{
		monsterClass: MechanicalBossEarly,
		rampStart: 35,
		rampEnd: 100,
		weight: 1,
	},
	{
		monsterClass: BombLayer,
		rampStart: 35,
		rampEnd: 45,
		weight: 10,
	},
	{
		monsterClass: DashChaser,
		rampStart: 40,
		rampEnd: 50,
		weight: 10,
	},
	{
		monsterClass: MechanicalBoss,
		rampStart: 55,
		rampEnd: 100,
		weight: .3,
	},
];

class MapGeneratorTimed extends MapGenerator {
	constructor(map) {
		super(map);

		this.occupiedNoise = new NoiseSimplex(2);
		this.rockNoise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.weightAccumulated = 0;
		this.pendingMonsters = [];

		this.player = Player.defaultConstructor();
		this.player.setPosition(WIDTH * SPAWN_DIST, HEIGHT * SPAWN_DIST);
		map.addPlayer(this.player);
		map.addUi(this);
	}

	update() {
		super.update();
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
			this.pendingMonsters.shift();
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
}

export default MapGeneratorTimed;

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
