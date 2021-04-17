const MapGenerator = require('./MapGenerator');
const Vector = require('../util/Vector');
const {NoiseSimplex} = require('../util/Noise');
const {rand, randInt, floor, round} = require('../util/Number');
const MapBoundary = require('../entities/stills/MapBoundary');
const Rock = require('../entities/stills/Rock');
const RockMineral = require('../entities/stills/RockMineral');
const Egg = require('../entities/stills/Egg');
const ProjectileAttack = require('../abilities/ProjectileAttack');
const Dash = require('../abilities/Dash');
const IncDefense = require('../abilities/IncDefense');
const DelayedRegen = require('../abilities/DelayedRegen');
const Respawn = require('../abilities/Respawn');
const {Colors} = require('../util/Constants');
const Player = require('../entities/heroes/Player');
const BotHero = require('../entities/heroes/BotHero');
const VShip = require('../graphics/VShip');
const WShip = require('../graphics/WShip');
const EggBot = require('../entities/bot/EggBot');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

const WIDTH = 2.5, HEIGHT = 2.5;
const SPAWN_X1 = WIDTH / 5;
const SPAWN_X2 = WIDTH - SPAWN_X1;
const CENTER_V = new Vector(WIDTH / 2, HEIGHT / 2);
const CENTER_V_MAG = CENTER_V.magnitude; // todo [low] cache vector calculations and remove this pre-computation

class MapGeneratorEgg extends MapGenerator {
	constructor(map) {
		super(map);

		this.rockNoise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.generateEgg();
		this.generateBot();

		map.addPlayer(this.player);
		map.addUi(this);

		this.scores = [0, 0];
		this.win = -1;
	}

	generateBoundaries() {
		MapBoundary.createBoxBoundaries(WIDTH, HEIGHT).forEach(mapBoundary => this.map.addStill(mapBoundary));
	}

	generateRocks() {
		const ROCKS = 4, ROCK_MINERALS = 0;
		const ROCK_MAX_SIZE = .3;
		this.rockNoise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new Rock(...position, rand(ROCK_MAX_SIZE))));
		this.rockNoise.positions(ROCK_MINERALS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new RockMineral(...position, rand(ROCK_MAX_SIZE))));
	}

	generateEgg() {
		let n = 4;
		this.egg = new Egg([{x: WIDTH / 2, y: HEIGHT / n}, {x: WIDTH / 2, y: HEIGHT * (1 - 1 / n)}]);
		this.map.addStill(this.egg);
	}

	generateBot() {
		let coopBots = 1;
		let hostileBots = 2;
		let playerIndex = randInt(coopBots + 1);
		this.player = MapGeneratorEgg.generatePlayer(SPAWN_X1, (playerIndex + 1) / (coopBots + 2) * HEIGHT);
		let coopBotHeroes = [...Array(coopBots)].map((_, i, a) => MapGeneratorEgg.generateBotHero(SPAWN_X1, (i + 1 + (i >= playerIndex)) / (a.length + 2) * HEIGHT, true));
		let hostileBotHeroes = [...Array(hostileBots)].map((_, i, a) => MapGeneratorEgg.generateBotHero(SPAWN_X2, (i + 1) / (a.length + 1) * HEIGHT, false));
		let bot = new EggBot(this.player, coopBotHeroes, hostileBotHeroes, this.egg, CENTER_V);
		this.map.addBot(bot);
	}

	static generateHeroAbilities(x, y) {
		let abilities = [
			new ProjectileAttack(),
			new Dash(),
			new IncDefense(),
		];
		abilities.forEach((ability, i) => ability.setUi(i)); // some abilities give buffs which require UI colors to be set
		let passiveAbilities = [
			new DelayedRegen(),
			new Respawn(240, x, y),
		];
		return {abilities, passiveAbilities};
	}

	static generatePlayer(x, y) {
		let {abilities, passiveAbilities} = MapGeneratorEgg.generateHeroAbilities(x, y);
		abilities.forEach((ability, i) => ability.setUi(i));
		let payer = new Player(x, y, .05, .05, 1, 80, .13, true, abilities, passiveAbilities, Colors.LIFE, Colors.STAMINA);
		payer.setGraphics(new VShip(.05, .05, {fill: true, color: Colors.Entity.PLAYER_GREEN.get()}));
		return payer;
	}

	static generateBotHero(x, y, friendly) {
		let {abilities, passiveAbilities} = MapGeneratorEgg.generateHeroAbilities(x, y);
		let botHero = new BotHero(x, y, .05, .05, 1, 80, .13, friendly, abilities, passiveAbilities, Colors.LIFE, Colors.STAMINA);
		botHero.setGraphics(new VShip(.05, .05, {fill: true, color: friendly ? Colors.Entity.FRIENDLY.get() : Colors.Entity.MONSTER.get()}));
		return botHero;
	}

	update() {
		if (this.win !== -1)
			return;
		this.timer++;
		if (!this.egg.ownerHero)
			return;
		let scoreI = this.egg.ownerHero.friendly ? 0 : 1;
		let scoreInc = 1 - Vector.fromObj(this.egg.ownerHero).subtract(CENTER_V).magnitude / CENTER_V_MAG;
		this.scores[scoreI] += scoreInc;
		if (this.scores[scoreI] >= 1000)
			this.win = scoreI;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN, Positions.MARGIN * 2 + Positions.BAR_HEIGHT,
			`time: ${round(this.timer / 100)}`, font));
		painter.add(new Text(
			1 - Positions.MARGIN, Positions.MARGIN * 3 + Positions.BAR_HEIGHT * 2,
			`score: ${this.scores.map(s => floor(s / 100)).join(' v ')}`, font));

		if (this.win !== -1)
			painter.add(new Text(
				.5, .4,
				`${this.win ? 'Red' : 'Green'} Team Wins!`, {size: '25px', align: 'center'}));
	}
}

module.exports = MapGeneratorEgg;