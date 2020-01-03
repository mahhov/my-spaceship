const MapGenerator = require('./MapGenerator');
const {NoiseSimplex} = require('../util/Noise');
const Player = require('../entities/Player');
const {rand} = require('../util/Number');
const MapBoundary = require('../entities/MapBoundary');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const ProjectileAttack = require('../abilities/ProjectileAttack');
const Dash = require('../abilities/Dash');
const IncDefense = require('../abilities/IncDefense');
const DelayedRegen = require('../abilities/DelayedRegen');
const {Colors} = require('../util/Constants');
const BotHero = require('../entities/bot/BotHero');
const WShip = require('../graphics/WShip');
const EggBot = require('../entities/bot/EggBot');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

const WIDTH = 2.5, HEIGHT = 2.5;
const SPAWN_DIST = 1 / 5;
const SPAWN_X1 = WIDTH * SPAWN_DIST;
const SPAWN_X2 = WIDTH - SPAWN_X1;
const SPAWN_Y1 = HEIGHT * .45;
const SPAWN_Y2 = HEIGHT * .55;

class MapGeneratorEgg extends MapGenerator {
	constructor(map) {
		super(map);

		this.rockNoise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.player = new Player();
		this.player.setPosition(SPAWN_X1, SPAWN_Y1);

		this.generateBot();
		// todo [high] egg entity

		map.addPlayer(this.player);
		map.addUi(this);
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

	generateBot() {
		let coopBotHero = MapGeneratorEgg.generateBotHero(SPAWN_X1, SPAWN_Y2, true);
		let hostileBotHero1 = MapGeneratorEgg.generateBotHero(SPAWN_X2, SPAWN_Y1, false);
		let hostileBotHero2 = MapGeneratorEgg.generateBotHero(SPAWN_X2, SPAWN_Y2, false);
		let bot = new EggBot(this.player, [coopBotHero], [hostileBotHero1, hostileBotHero2]);
		this.map.addBot(bot);
	}

	static generateBotHero(x, y, friendly) {
		// todo [medium] dedupe with player constructor
		let abilities = [
			new ProjectileAttack(),
			new Dash(),
			new IncDefense(),
		];
		let passiveAbilities = [
			new DelayedRegen()
		];
		let botHero = new BotHero(x, y, .05, .05, 1, 80, .13, friendly, abilities, passiveAbilities, Colors.LIFE, Colors.STAMINA);
		botHero.setGraphics(new WShip(.05, .05, {fill: true, color: Colors.Entity.PLAYER.get()}));
		// todo [high] different colors and graphics for coop and hostile bots
		return botHero;
	}
}

module.exports = MapGeneratorEgg;
