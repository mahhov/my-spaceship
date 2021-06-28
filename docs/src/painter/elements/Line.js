import Vector from '../../util/Vector.js';
import Path from './Path.js';

class Line extends Path {
	constructor(x, y, x2, y2, width) {
		let w = new Vector(x2 - x, y2 - y).rotateByCosSin(0, 1);
		w.magnitude = width;
		let xys = [
			[x - w.x, y - w.y],
			[x + w.x, y + w.y],
			[x2 + w.x, y2 + w.y],
			[x2 - w.x, y2 - w.y],
		];
		super(xys, true);
	}

	setOptions({color = '#000', thickness = 1} = {}) {
		return super.setOptions({color, thickness});
	}

	// todo [medium] use Coordinate and camera.transformCoordinates
	static withCamera(camera, x, y, x2, y2, width, {fill, color, thickness} = {}) {
		return new Line(camera.xt(x), camera.yt(y), camera.xt(x2), camera.yt(y2), camera.st(width), {fill, color, thickness: camera.st(thickness)});
	}
}

export default Line;
