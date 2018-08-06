const LinkedList = require('../util/LinkedList');
const Entity = require('../entities/Entity');
const Logic = require('./Logic');
const MapGenerator = require('../map/MapGenerator');
const Camera = require('../camera/Camera');
const Rect = require('../painter/Rect');
const Color = require('../util/Color');
const RectC = require('../painter/RectC');

class FakePlayer {
	setPosition() {
	}
}

class FakeMap {
	constructor() {
		this.rocks = new LinkedList();
		this.monsters = new LinkedList();
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
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
		this.reset();
		this.camera = new Camera(this.map.width / 2, this.map.height / 2, (this.map.width + this.map.height) / 2);
	}

	reset() {
		this.map = new FakeMap();
		this.player = new FakePlayer();
		MapGenerator.generateSample(this.map, this.player);
	}

	iterate() {
		if (this.controller.getKeyState(' ').pressed)
			this.reset();

		this.updateCamera();

		this.painter.add(new Rect(0, 0, 1, 1, {fill: true}));
		this.painter.add(RectC.withCamera(this.camera, this.map.width / 2, this.map.height / 2, this.map.width, this.map.height, {color: Color.WHITE.get(), thickness: 2}));
		this.map.paint(this.painter, this.camera);
	}

	updateCamera() {
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x * this.map.width, y: y * this.map.height}, {x, y});
	}
}

module.exports = MapDemo;
