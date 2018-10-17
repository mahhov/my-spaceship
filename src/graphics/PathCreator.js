const Path = require('../painter/Path');
const {PI2, thetaToVector} = require('../util/Number');

class PathCreator {
	constructor() {
		this.xys = [];
		this.cx = .5;
		this.cy = .5;
		this.fx = 0;
		this.fy = -1;
		this.sx = .1;
		this.sy = .1;
		this.x = 0;
		this.y = 0;
		this.pathPoints = [];
	}

	setCamera(camera) {
		this.camera = camera;
	}

	setFill(fill) {
		this.fill = fill;
	}

	setColor(color) {
		this.color = color;
	}

	setThickness(thickness) {
		this.thickness = thickness;
	}

	setTranslation(x, y) {
		this.cx = x;
		this.cy = y;
	}

	setForward(x, y) {
		this.fx = x;
		this.fy = y;
	}

	setScale(x, y, s) {
		this.sx = x * s;
		this.sy = y * s;
		this.ss = (x + y) / 2 * s;
	}

	setClosed(closed) {
		this.closed = closed;
	}

	moveTo(x, y, skipAdd) {
		this.x = x;
		this.y = y;
		skipAdd || this.add();
	}

	moveBy(x, y, skipAdd) {
		this.x += x;
		this.y += y;
		skipAdd || this.add();
	}

	add() {
		this.xys.push([this.x, this.y]);
	}

	create() {
		let pathPoints = this.computePathPoints();
		let thickness = this.computeThickness();
		return new Path(pathPoints, this.closed, {fill: this.fill, color: this.color, thickness});
	}

	computePathPoints() {
		// [0, 1] maps to center + forward
		let pathPoints = [];
		this.xys.forEach(([x, y]) => {
			x *= this.sx;
			y *= this.sy;
			let pathX = this.cx + this.fx * y - this.fy * x;
			let pathY = this.cy + this.fy * y + this.fx * x;
			pathPoints.push([this.camera.xt(pathX), this.camera.yt(pathY)]);
		});
		return pathPoints;
	}

	computeThickness() {
		return this.camera.st(this.thickness * this.ss);
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
}

module.exports = PathCreator;
