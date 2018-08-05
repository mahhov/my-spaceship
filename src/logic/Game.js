const Logic = require('./Logic');
const Keymapping = require('../control/Keymapping');
const Map = require('../map/Map');
const Player = require('../entities/Player');
const MapGenerator = require('../map/MapGenerator');
const Minimap = require('../map/Minimap');
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
		this.minimap = new Minimap(this.map);
		this.camera = new Camera(this.player.x, this.player.y);
		this.starfield = new Starfield(...this.map.getSize());
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
		this.minimap.update(this.controller, this.keymapping);
	}

	paint() {
		this.starfield.paint(this.painter, this.camera);
		this.map.paint(this.painter, this.camera);
		this.minimap.paint(this.painter);
		if (UI)
			this.map.paintUi(this.painter, this.camera)
	}
}

module.exports = Game;

// todo [graphics]
// textures
// ui interface

// todo [content]
// map generation
// instances
// mobs
// sector modes
// resources
// crafting
// skill leveling

// todo [other]
// chat
// save
// minimap

// todo [high]
// spawn player away from enemies
// boss to recieve special marking in minimap
