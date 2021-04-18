const Logic = require('./Logic');
const Keymapping = require('../control/Keymapping');
const Map = require('../map/Map');
const MonsterKnowledge = require('../entities/monsters/MonsterKnowledge');
const MapGenerator = require('../map/MapGeneratorTimed');
const Minimap = require('../map/Minimap');
const Camera = require('../camera/Camera');
const Starfield = require('../starfield/Starfield');

const UI = true;

class Game extends Logic {
	constructor(controller, painterSet, MapGeneratorClass = MapGenerator) {
		super(controller, painterSet);
		this.map = new Map();
		this.mapGenerator = new MapGeneratorClass(this.map);
		this.player = this.mapGenerator.player;
		this.monsterKnowledge = new MonsterKnowledge();
		this.monsterKnowledge.setPlayer(this.player);
		this.minimap = new Minimap(this.map);
		this.camera = new Camera(this.player.x, this.player.y);
		this.starfield = new Starfield(...this.map.getSize());
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
			Keymapping.getControlState(this.controller, Keymapping.Controls.ZOOM_OUT).active,
			Keymapping.getControlState(this.controller, Keymapping.Controls.ZOOM_IN).active);
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
// audio

// todo [content]
// map generation i.e. dungeons
// instances with difficulty, monster variety, and dungeon layout
// mob variety
// sector modes
// resources
// crafting & gear
// skill leveling
// classes & abilities

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
