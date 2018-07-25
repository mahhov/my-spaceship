const Keymapping = require('./control/Keymapping');
const Camera = require('./camera/Camera');
const Map = require('./map/Map');

const UI = false;

class Logic {
	constructor(controller, painter) {
		this.controller = controller;
		this.painter = painter;
		this.keymapping = new Keymapping();
		this.camera = new Camera();
		this.map = new Map();
		this.map.populate(); // todo x map shouldn't be repsonsible for pouplating itself
		this.player = this.map.getPlayer();
	}

	iterate() {
		this.update();
		this.paint();
	}

	update() {
		this.camera.move(this.player, this.controller.getRawMouse());
		this.controller.inverseTransformMouse(this.camera);
		this.map.update(this.controller, this.keymapping);
	}

	paint() {
		this.map.paint(this.painter, this.camera);

		if (UI) {
			this.player.paintUi(this.painter, this.camera);
			this.boss1.paintUi(this.painter, this.camera);
		}
	}
}

module.exports = Logic;

// todo graphics
// particles
// asteroid vectors
// textures
// starfield background

// todo content
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
// add larger map
// add map background
// particles
// refactor health, stamina, cooldown to share utility. maybe converge with decay and phase as well
// refactor coordinate system to support coordintaes, centered coordintaes, and camera coordintaes to replace current constructor overloading
// reset target lock if target expires
