import Path from '../painter/elements/Path.js';
import {PI2, thetaToVector} from '../util/number.js';
import Vector from '../util/Vector.js';

// todo [medium] split this to its own file if we end up replacing Graphics with Graphics2
class GraphicsPath {
	constructor(points, closed = false,
	            x = 0, y = 0, scale = 1,
	            fill = false, color = '#fff', thickness = 1) {
		this.points = points;
		this.closed = closed;
		this.x = x;
		this.y = y;
		this.scale = scale;
		this.fill = fill;
		this.color = color;
		this.thickness = thickness;

	}

	// todo [medium] use this everywhere where useful
	static createCirclePoints(r = 1, n = 6, x = 0, y = 0) {
		let points = [];
		for (let i = 0; i < n; i++) {
			let theta = i * PI2 / n;
			let vector = thetaToVector(theta, r);
			points.push([x + vector[0], y + vector[1]]);
		}
		return points;
	};

	calculateRawSize() {
		let xs = this.points.map(([x]) => x);
		let ys = this.points.map(([_, y]) => y);
		let width = Math.max(...xs) - Math.min(...xs);
		let height = Math.max(...ys) - Math.min(...ys);
		return {width, height, avg: (width + height) / 2};
	}

	paint(painter, camera, graphicsX, graphicsY, graphicsWidth, graphicsHeight, graphicsDirection) {
		let size = this.calculateRawSize();
		let scale = this.scale / size.avg;
		let position = new Vector(this.x, this.y);
		let graphicsAvgSize = (graphicsWidth + graphicsHeight) / 2;
		let graphicsPosition = new Vector(graphicsX, graphicsY);
		let xys = this.points.map(([x, y]) => {
			let v = new Vector(x, y)
				.multiply(scale)
				.add(position)
				.rotateByCosSin(0, -1)
				.rotateByCosSin(graphicsDirection.x, graphicsDirection.y)
				.multiply(graphicsAvgSize)
				.add(graphicsPosition);
			return [camera.xt(v.x), camera.yt(v.y)];
		});
		painter.add(new Path(xys, this.closed).setOptions({fill: this.fill, color: this.color, thickness: this.thickness}));
	}
}

class Graphics2 {
	constructor(width, height) {
		this.paths = [];
		this.width = width;
		this.height = height;
	}

	addPath(path) {
		this.paths.push(path);
	}

	paint(painter, camera, x, y, moveDirection) {
		this.paths.forEach(path => path.paint(painter, camera, x, y, this.width, this.height, moveDirection));
	}
}

Graphics2.GraphicsPath = GraphicsPath;

export default Graphics2;
