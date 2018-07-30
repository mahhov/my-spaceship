const Logic = require('./Logic');
const Keymapping = require('../control/Keymapping');
const Camera = require('../camera/Camera');
const Map = require('../map/Map');
const Player = require('../entities/Player');
const MapGenerator = require('../map/MapGenerator');
const Starfield = require('../starfield/Starfield');

const UI = true;

class Game extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.keymapping = new Keymapping();
		this.camera = new Camera(.5, .5);
		this.map = new Map();
		this.player = new Player(.5, .5);
		MapGenerator.generateSample(this.map, this.player);
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
