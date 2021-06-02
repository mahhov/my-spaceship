import Camera from '../camera/Camera.js';
import keyMappings from '../control/keyMappings.js';
import MonsterKnowledge from '../entities/monsters/MonsterKnowledge.js';
import Map from '../map/Map.js';
import MapGenerator from '../map/MapGeneratorTimed.js';
import Minimap from '../map/Minimap.js';
import Starfield from '../starfield/Starfield.js';
import Frame from './Frame.js';

class GameWorld extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
	}

	reset(MapGeneratorClass = MapGenerator) {
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
		if (keyMappings.pause.getState(this.controller).pressed)
			this.emit('pause');
	}

	updateCamera() {
		this.camera.move(this.player, this.controller.getRawMouse(.5, .5));
		this.camera.zoom(
			keyMappings.zoomOut.getState(this.controller).active,
			keyMappings.zoomIn.getState(this.controller).active);
	}

	paint() {
		this.starfield.paint(this.painterSet.painter, this.camera);
		this.map.paint(this.painterSet.painter, this.camera);
		this.minimap.paint(this.painterSet.uiPainter);
		this.map.paintUi(this.painterSet.uiPainter, this.camera);
	}
}

export default GameWorld;
