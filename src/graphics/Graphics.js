const PathCreator = require('./PathCreator');

class Graphics {
	constructor() {
		this.pathCreators = [];
	}

	addPath(width, height, points, {fill, color, thickness} = {}) {
		let pathCreator = new PathCreator();
		pathCreator.setFill(fill);
		pathCreator.setColor(color);
		pathCreator.setThickness(thickness);
		pathCreator.setScale(width, height, Graphics.calculateScale(points));
		points.forEach(point => pathCreator.moveTo(...point));
		this.pathCreators.push(pathCreator);
	}

	paint(painter, camera, x, y, moveDirection) {
		this.pathCreators.forEach(pathCreator => {
			pathCreator.setCamera(camera);
			pathCreator.setTranslation(x, y);
			pathCreator.setForward(moveDirection.x, moveDirection.y);
			painter.add(pathCreator.create())
		});
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
