const LinkedList = require('../util/LinkedList');
const Entity = require('../entities/Entity');
const Logic = require('./Logic');
const MapGenerator = require('../map/MapGenerator');
const Camera = require('../camera/Camera');
const Color = require('../util/Color');
const RectC = require('../painter/RectC');

class FakePlayer {
	setPosition() {
	}
}

class FakeMap {
	constructor() {
		this.stills = new LinkedList();
		this.monsters = new LinkedList();
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
	}

	addStill(still) {
		this.stills.add(still);
	}

	addPlayer(player) {
	}

	addMonster(monster) {
		this.monsters.add(monster);
	}

	addUi(ui) {
	}

	paint(painter, camera) {
		this.stills.forEach(still => still.paint(painter, camera));
		this.monsters.forEach(monster => Entity.prototype.paint.call(monster, painter, camera)); // to avoid painting modules
	}
}

class MapDemo extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.reset();
		this.camera = new Camera(this.map.width / 2, this.map.height / 2, (this.map.width + this.map.height) / 2);
	}

	reset() {
		this.map = new FakeMap();
		this.player = new FakePlayer();
		new MapGenerator(this.map, this.player).generate();
	}

	iterate() {
		if (this.controller.getKeyState(' ').pressed)
			this.reset();

		this.updateCamera();

		this.painterSet.uiPainter.add(RectC.withCamera(this.camera, this.map.width / 2, this.map.height / 2, this.map.width, this.map.height, {color: Color.WHITE.get(), thickness: 2}));
		this.map.paint(this.painterSet.uiPainter, this.camera);
	}

	updateCamera() {
		let {x, y} = this.controller.getRawMouse(.5, .5);
		this.camera.move({x: x * this.map.width, y: y * this.map.height}, {x, y});
		this.camera.zoom(this.controller.getKeyState('z').active, this.controller.getKeyState('x').active);
	}
}

module.exports = MapDemo;
