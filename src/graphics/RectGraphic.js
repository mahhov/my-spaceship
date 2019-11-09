const Graphics = require('./Graphics');

class RectGraphic extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super();
		let rect = [
			[-1, -1],
			[-1, 1],
			[1, 1],
			[1, -1]];
		this.addPath(width, height, rect, true, {fill, color, thickness});
	}
}

module.exports = RectGraphic;
