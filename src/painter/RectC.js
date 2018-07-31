const Rect = require('./Rect');

class RectC extends Rect {
	// todo [low] refactor coordinate system to support coordintaes, centered coordintaes, and camera coordintaes to replace current constructor overloading
	constructor(centerX, centerY, width, height, {fill, color, thickness} = {}) {
		super(centerX - width / 2, centerY - height / 2, width, height, {fill, color, thickness});
	}

	static withCamera(camera, centerX, centerY, width, height, {fill, color, thickness} = {}) {
		return new RectC(camera.xt(centerX), camera.yt(centerY), camera.st(width), camera.st(height), {fill, color, thickness});
	}
}

module.exports = RectC;
