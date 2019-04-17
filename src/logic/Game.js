const Logic = require('./Logic');
const Keymapping = require('../control/Keymapping');
const Map = require('../map/Map');
const Player = require('../entities/Player');
const MonsterKnowledge = require('../entities/monsters/MonsterKnowledge');
const MapGenerator = require('../map/MapGenerator');
const Minimap = require('../map/Minimap');
const Camera = require('../camera/Camera');
const Starfield = require('../starfield/Starfield');

const UI = true;

class Game extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.map = new Map();
		this.player = new Player();
		this.monsterKnowledge = new MonsterKnowledge();
		this.monsterKnowledge.setPlayer(this.player);
		this.mapGenerator = new MapGenerator(this.map, this.player);
		this.mapGenerator.generate();
		this.minimap = new Minimap(this.map);
		this.camera = new Camera(this.player.x, this.player.y);
		this.starfield = new Starfield(...this.map.getSize());
	}

	iterate() {
		this.update();
		this.paint();
	}

	update() {
		this.updateCamera();
		this.controller.inverseTransformMouse(this.camera);
		this.mapGenerator.update();
		this.map.update(this.controller, this.monsterKnowledge);
		this.minimap.update(this.controller);
	}

	updateCamera() {
		this.camera.move(this.player, this.controller.getRawMouse(.5, .5));
		this.camera.zoom(
			Keymapping.getControlState(this.controller, Keymapping.Keys.ZOOM_OUT).active,
			Keymapping.getControlState(this.controller, Keymapping.Keys.ZOOM_IN).active);
	}

	paint() {
		this.starfield.paint(this.painterSet.painter, this.camera);
		this.map.paint(this.painterSet.painter, this.camera);
		if (UI) {
			this.minimap.paint(this.painterSet.uiPainter);
			this.map.paintUi(this.painterSet.uiPainter, this.camera);
		}
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
// consider restructuring packages. src>abilities & src>entities>module r symmetric

// todo [monster]
// skirmersher
// laser, short range raiders
// latchers that reduce max health
// linkers that reduce speed and drain health
// traps
// dots
