const Keymapping = require('../control/Keymapping');
const Camera = require('../camera/Camera');
const {UiCs} = require('../util/UiConstants');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');

class Minimap {
	constructor(map) {
		this.map = map;
	}

	toggleZoom() {
		this.zoom = !this.zoom;
	}

	update(controller, keymapping) {
		if (keymapping.getKeyState(controller, Keymapping.Keys.MINIMAP_ZOOM).pressed)
			this.toggleZoom();
	}

	createCamera() {
		const OFFSET = .01, SCALE_BASE_SMALL = .15, SCALE_BASE_LARGE = .4;
		let scale = (this.zoom ? SCALE_BASE_LARGE : SCALE_BASE_SMALL);
		return Camera.createForRegion(this.map.width, OFFSET, OFFSET, scale);
	}

	paint(painter) {
		let camera = this.createCamera();
		painter.add(Rect.withCamera(camera, 0, 0, this.map.width, this.map.height, {fill: true, color: UiCs.Minimap.BACKGROUND.get()}));
		this.map.stills.forEach(rock => Minimap.paintDot(painter, camera, rock.x, rock.y, UiCs.Minimap.ROCK.get()));
		this.map.monsters.forEach(monster => Minimap.paintDot(painter, camera, monster.x, monster.y, UiCs.Minimap.MONSTER.get()));
		this.map.uis.forEach(ui => Minimap.paintDot(painter, camera, ui.x, ui.y, UiCs.Minimap.BOSS.get()));
		Minimap.paintDot(painter, camera, this.map.player.x, this.map.player.y, UiCs.Minimap.PLAYER.get());
	}

	static paintDot(painter, camera, x, y, color) {
		const DOT_SIZE = .2;
		painter.add(RectC.withCamera(camera, x, y, DOT_SIZE, DOT_SIZE, {fill: true, color}));
	}
}

module.exports = Minimap;
