const Rect = require('./Rect');

class RectC extends Rect {
	constructor(centerX, centerY, width, height, color, fill) {
		super(centerX - width / 2, centerY - height / 2, width, height, color, fill);
	}
}

module.exports = RectC;
