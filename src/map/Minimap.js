const Keymapping = require('../control/Keymapping');
const Camera = require('../camera/Camera');
const {Colors} = require('../util/Constants');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');

class Minimap {
	constructor(map) {
		this.map = map;
	}

	toggleZoom() {
		this.zoom = !this.zoom;
	}

	update(controller) {
		if (Keymapping.getControlState(controller, Keymapping.Controls.MINIMAP_ZOOM).pressed)
			this.toggleZoom();
	}

	createCamera() {
		const OFFSET = .01, SCALE_BASE_SMALL = .15, SCALE_BASE_LARGE = .4;
		let scale = (this.zoom ? SCALE_BASE_LARGE : SCALE_BASE_SMALL);
		return Camera.createForRegion(this.map.width, OFFSET, OFFSET, scale);
	}

	paint(painter) {
		let camera = this.createCamera();
		painter.add(Rect.withCamera(camera, 0, 0, this.map.width, this.map.height, {fill: true, color: Colors.Minimap.BACKGROUND.get()}));
		painter.add(Rect.withCamera(camera, 0, 0, this.map.width, this.map.height, {fill: false, color: Colors.Minimap.BORDER.get()}));
		this.map.stills.forEach(rock => this.paintDot(painter, camera, rock.x, rock.y, Colors.Minimap.ROCK.get()));
		this.map.monsters.forEach(monster => this.paintDot(painter, camera, monster.x, monster.y, Colors.Minimap.MONSTER.get()));
		this.map.uis.forEach(ui => this.paintDot(painter, camera, ui.x, ui.y, Colors.Minimap.BOSS.get()));
		this.paintDot(painter, camera, this.map.player.x, this.map.player.y, Colors.Minimap.PLAYER.get());
	}

	paintDot(painter, camera, x, y, color) {
		const DOT_SIZE = .02 * this.map.width;
		painter.add(RectC.withCamera(camera, x, y, DOT_SIZE, DOT_SIZE, {fill: true, color}));
	}
}

module.exports = Minimap;
