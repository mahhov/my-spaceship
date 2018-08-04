const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');

class Minimap {
	constructor(map) {
		this.map = map;
	}

	toggleZoom() {
		this.zoom = !this.zoom;
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
		const BACKGROUND_COLOR = 'rgba(255, 255, 255, .2)'; // todo [high] use real color
		const ROCK_COLOR = '#000';
		const PLAYER_COLOR = '#00f';
		const MONSTER_COLOR = '#f00';

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
