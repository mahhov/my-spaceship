const PathCreator = require('./PathCreator');
const {booleanArray} = require('../util/Number');

class Graphics {
	constructor(color, width, height, scale, points) {
		this.pathCreator = new PathCreator();
		this.pathCreator.setColor(color);
		this.pathCreator.setScale(width, height, scale);
		points.forEach(point => this.pathCreator.moveTo(...point));
	}

	paint(painter, x, y, moveDirection) {
		this.pathCreator.setTranslation(x, y);
		if (booleanArray(moveDirection))
			this.pathCreator.setForward(...moveDirection);
		painter.add(this.pathCreator.create())
	}
}

module.exports = Graphics;
