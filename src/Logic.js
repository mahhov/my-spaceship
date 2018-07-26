const Keymapping = require('./control/Keymapping');
const Camera = require('./camera/Camera');
const Map = require('./map/Map');
const Player = require('./entities/Player');
const MapGenerator = require('./map/MapGenerator');

const UI = false;

class Logic {
	constructor(controller, painter) {
		this.controller = controller;
		this.painter = painter;
		this.keymapping = new Keymapping();
		this.camera = new Camera();
		this.map = new Map();
		this.player = new Player(.5, .5);
		MapGenerator.generateSample(this.map, this.player);
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
		this.map.paint(this.painter, this.camera);
		if (UI)
			this.map.paintU(this.painter, this.camera)
	}
}

module.exports = Logic;

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
// add map background
// particles
// refactor health, stamina, cooldown to share utility. maybe converge with decay and phase as well
// refactor coordinate system to support coordintaes, centered coordintaes, and camera coordintaes to replace current constructor overloading
// reset target lock if target expires
