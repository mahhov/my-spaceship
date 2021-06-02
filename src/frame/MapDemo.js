import LinkedList from '../util/LinkedList.js';
import Entity from '../entities/Entity.js';
import Frame from './Frame.js';
import MapGenerator from '../map/MapGeneratorStaged.js';
import Camera from '../camera/Camera.js';
import Coordinate from '../util/Coordinate.js';
import Color from '../util/Color.js';
import Rect from '../painter/elements/Rect.js';

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

class MapDemo extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.reset();
		this.camera = new Camera(this.map.width / 2, this.map.height / 2, (this.map.width + this.map.height) / 2);
	}

	reset() {
		this.map = new FakeMap();
		this.player = new FakePlayer();
		new MapGenerator(this.map);
	}

	update() {
		if (this.controller.getKeyState(' ').pressed)
			this.reset();
		this.updateCamera();
	}

	paint() {
		let coordinate = new Coordinate(0, 0, this.width, this.height);
		this.painterSet.uiPainter.add(Rect.withCamera(this.camera, coordinate, {color: Color.WHITE.get(), thickness: 2}));
		this.map.paint(this.painterSet.uiPainter, this.camera);
	}

	updateCamera() {
		let {x, y} = this.controller.getRawMouse(.5, .5);
		this.camera.move({x: x * this.map.width, y: y * this.map.height}, {x, y});
		this.camera.zoom(this.controller.getKeyState('z').active, this.controller.getKeyState('x').active);
	}
}

export default MapDemo;
