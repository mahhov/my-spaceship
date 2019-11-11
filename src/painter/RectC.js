const Rect = require('./Rect');

class RectC extends Rect {
	// todo [low] refactor coordinate system to support coordintaes, centered coordintaes, and camera coordintaes to replace current constructor overloading
	constructor(centerX, centerY, width, height, graphicOptions = {}) {
		super(centerX - width / 2, centerY - height / 2, width, height, graphicOptions);
	}

	static withCamera(camera, centerX, centerY, width, height, {fill, color, thickness} = {}) {
		return new RectC(camera.xt(centerX), camera.yt(centerY), camera.st(width), camera.st(height), {fill, color, thickness: camera.st(thickness)});
	}
}

module.exports = RectC;
