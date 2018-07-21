const Rect = require('./Rect');

class RectC extends Rect {
	constructor(centerX, centerY, width, height, {fill, color, thickness} = {}) {
		super(centerX - width / 2, centerY - height / 2, width, height, {fill, color, thickness});
	}

	static withCamera(camera, centerX, centerY, width, height, {fill, color, thickness} = {}) {
		return new RectC(camera.xt(centerX), camera.yt(centerY), camera.st(width), camera.st(height), {fill, color, thickness});
	}
}

module.exports = RectC;
