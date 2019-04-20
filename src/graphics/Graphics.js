const PathCreator = require('./PathCreator');

class Graphics {
	constructor() {
		this.pathCreators = [];
	}

	// todo deprecated and replace with addPathXY
	addPath(width, height, points, closed, {fill, color, thickness} = {}) {
		let pathCreator = new PathCreator();
		pathCreator.setFill(fill);
		pathCreator.setColor(color);
		pathCreator.setThickness(thickness);
		pathCreator.setScale(width, height, Graphics.calculateScale(points));
		pathCreator.setClosed(closed);
		points.forEach(point => pathCreator.moveTo(...point));
		this.pathCreators.push(pathCreator);
	}

	addPathXY(x, y, width, height, points, closed, {fill, color, thickness} = {}) {
		let pathCreator = new PathCreator();
		pathCreator.setFill(fill);
		pathCreator.setColor(color);
		pathCreator.setThickness(thickness);
		pathCreator.setTranslation(x, y);
		pathCreator.setScale(width, height, Graphics.calculateScale(points));
		pathCreator.setClosed(closed);
		points.forEach(point => pathCreator.moveTo(...point));
		this.pathCreators.push(pathCreator);
	}

	paint(painter, camera, x, y, moveDirection) {
		this.pathCreators.forEach(pathCreator => {
			pathCreator.setCamera(camera);
			pathCreator.setCenter(x, y);
			pathCreator.setForward(moveDirection.x, moveDirection.y);
			painter.add(pathCreator.create());
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
