const Graphics = require('./Graphics');

class RectGraphic extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		let rect = [
			[-1, -1],
			[-1, 1],
			[1, 1],
			[1, -1]];
		this.addPath(width, height, rect, true, graphicOptions);
	}
}

module.exports = RectGraphic;
