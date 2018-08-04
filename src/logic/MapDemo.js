const Logic = require('./Logic');
const Map = require('../map/Map');
const Player = require('../entities/Player');
const MapGenerator = require('../map/MapGenerator');
const LinkedList = require('../util/LinkedList'); // todo [high] order
const Camera = require('../camera/Camera');
const Controller = require('../control/Controller');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');
const Entity = require('../entities/Entity');

class FakePlayer {
	setPosition() {
	}
}

class FakeMap {
	constructor() {
		this.rocks = new LinkedList();
		this.monsters = new LinkedList();
	}

	addRock(rock) {
		this.rocks.add(rock);
	}

	addPlayer(player) {
	}

	addMonster(monster) {
		this.monsters.add(monster);
	}

	paint(painter, camera) {
		this.rocks.forEach(rock => rock.paint(painter, camera));
		this.monsters.forEach(monster => Entity.prototype.paint.call(monster, painter, camera)); // to avoid painting modules
	}
}

class MapDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.camera = new Camera(MapGenerator.width / 2, MapGenerator.height / 2, (MapGenerator.width + MapGenerator.height) / 2);
		this.reset();
	}

	reset() {
		this.map = new FakeMap();
		this.player = new FakePlayer();
		MapGenerator.generateSample(this.map, this.player);
	}

	iterate() {
		this.painter.add(new Rect(0, 0, 1, 1, {fill: true}));
		this.painter.add(RectC.withCamera(this.camera, MapGenerator.width / 2, MapGenerator.height / 2, MapGenerator.width, MapGenerator.height, {color: '#fff', thickness: 2}));

		this.updateCamera();

		if (this.controller.getKeyState(' ') === Controller.KeyStates.PRESSED)
			this.reset();

		this.map.paint(this.painter, this.camera);
	}

	updateCamera() {
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x * MapGenerator.width, y: y * MapGenerator.height}, {x, y});
	}
}

module.exports = MapDemo;
