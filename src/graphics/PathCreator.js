const Path = require('../painter/Path');

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
		if (this.cx === x && this.cy === y)
			return;
		this.cx = x;
		this.cy = y;
	}

	setForward(x, y) {
		if (this.fx === x && this.fy === y)
			return;
		this.fx = x;
		this.fy = y;
	}

	setScale(x, y, s) {
		if (this.sx === x * s && this.sy === y * s)
			return;
		this.sx = x * s;
		this.sy = y * s;
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
		this.computePathPoints();
		return new Path(this.pathPoints, {fill: this.fill, color: this.color, thickness: this.thickness});
	}

	computePathPoints() {
		// [0, 1] maps to center + forward
		this.pathPoints = [];
		this.xys.forEach(([x, y]) => {
			x *= this.sx;
			y *= this.sy;
			let pathX = this.cx + this.fx * y - this.fy * x;
			let pathY = this.cy + this.fy * y + this.fx * x;
			this.pathPoints.push([this.camera.xt(pathX), this.camera.yt(pathY)]);
		});
	}
}

module.exports = PathCreator;
