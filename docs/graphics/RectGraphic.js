import Graphics from './Graphics.js';

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

export default RectGraphic;
