const Logic = require('./Logic');
const Keymapping = require('../control/Keymapping');
const Map = require('../map/Map');
const Player = require('../entities/Player');
const MapGenerator = require('../map/MapGenerator');
const Camera = require('../camera/Camera');
const Starfield = require('../starfield/Starfield');

const UI = true;

class Game extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.keymapping = new Keymapping();
		this.map = new Map();
		this.player = new Player();
		MapGenerator.generateSample(this.map, this.player);
		this.camera = new Camera(this.player.x, this.player.y);
		this.starfield = new Starfield(MapGenerator.width, MapGenerator.height);
	}

	iterate() {
		this.update();
		this.paint();
	}

	update() {
		this.camera.move(this.player, this.controller.getRawMouse());
		this.camera.zoom(this.controller, this.keymapping);
		this.controller.inverseTransformMouse(this.camera);
		this.map.update(this.controller, this.keymapping);
	}

	paint() {
		this.starfield.paint(this.painter, this.camera);
		this.map.paint(this.painter, this.camera);
		if (UI)
			this.map.paintU(this.painter, this.camera)
	}
}

module.exports = Game;

// todo graphics
// particles
// asteroid vectors
// textures
// starfield background

// todo content
// map generation
// instances
// mobs
// sector modes
// resources
// crafting
// skill leveling

// todo other
// chat
// save

// todo x ordered
// boss ui + enrage timer + attacks to only trigger when player comes near
