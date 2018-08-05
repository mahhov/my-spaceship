const Keymapping = require('../control/Keymapping');
const Color = require('../util/Color');
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
		if (keymapping.isPressed(controller, Keymapping.Keys.MINIMAP_ZOOM))
			this.toggleZoom();
	}

	createCamera() {
		const OFFSET = .01, SCALE_BASE_SMALL = .15, SCALE_BASE_LARGE = .4;
		let scale = (this.zoom ? SCALE_BASE_LARGE : SCALE_BASE_SMALL) / this.map.width;
		return { // todo [high] use real camera
			xt: x => OFFSET + x * scale,
			yt: y => OFFSET + y * scale,
			st: size => size * scale
		};
	}

	paint(painter) {
		const BACKGROUND_COLOR = Color.from1(1, 1, 1, .2).get();
		const ROCK_COLOR = Color.from1(0, 0, 0).get();
		const PLAYER_COLOR = Color.from1(0, 0, 1).get();
		const MONSTER_COLOR = Color.from1(1, 0, 0).get();

		let camera = this.createCamera();
		painter.add(Rect.withCamera(camera, 0, 0, this.map.width, this.map.height, {fill: true, color: BACKGROUND_COLOR}));
		this.map.rocks.forEach(rock => this.paintDot(painter, camera, rock.x, rock.y, ROCK_COLOR));
		this.paintDot(painter, camera, this.map.player.x, this.map.player.y, PLAYER_COLOR);
		this.map.monsters.forEach(monster => this.paintDot(painter, camera, monster.x, monster.y, MONSTER_COLOR));
	}

	paintDot(painter, camera, x, y, color) {
		const DOT_SIZE = .2;
		painter.add(RectC.withCamera(camera, x, y, DOT_SIZE, DOT_SIZE, {fill: true, color}));
	}
}

module.exports = Minimap;
