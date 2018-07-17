const PathCreator = require('./PathCreator');
const {booleanArray} = require('../util/Number');

class Graphics {
	constructor(color, width, height, points) {
		this.pathCreator = new PathCreator();
		this.pathCreator.setColor(color);
		this.pathCreator.setScale(width, height, Graphics.calculateScale(points));
		points.forEach(point => this.pathCreator.moveTo(...point));
	}

	paint(painter, x, y, moveDirection) {
		this.pathCreator.setTranslation(x, y);
		if (booleanArray(moveDirection))
			this.pathCreator.setForward(...moveDirection);
		painter.add(this.pathCreator.create())
	}

	static calculateScale(points) {
		let xs = points.map(([x]) => x);
		let ys = points.map(([_, y]) => y);
		let xd = Math.max(...xs) - Math.min(...xs);
		let yd = Math.max(...ys) - Math.min(...ys);
		return 2 / (xd + yd);
	}
}

module.exports = Graphics;
