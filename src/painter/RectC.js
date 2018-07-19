const Rect = require('./Rect');

class RectC extends Rect {
	constructor(centerX, centerY, width, height, color, fill) {
		super(centerX - width / 2, centerY - height / 2, width, height, color, fill);
	}

	static withCamera(camera, centerX, centerY, width, height, color, fill) {
		return new RectC(camera.xt(centerX), camera.yt(centerY), camera.st(width), camera.st(height), color, fill);
	}
}

module.exports = RectC;
