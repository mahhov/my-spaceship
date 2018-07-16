const Path = require('../painter/Path');

class PathCreator {
	constructor(color) {
		this.color = color;
		this.xys = [];
		this.cx = .5;
		this.cy = .5;
		this.fx = 0;
		this.fy = -1;
		this.sx = .1;
		this.sy = .1;
		this.x = 0;
		this.y = 0;
	}

	setTranslation(x, y) {
		this.cx = x;
		this.cy = y;
		return this;
	}

	setForward(x, y) {
		this.fx = x;
		this.fy = y;
		return this;
	}

	setScale(x, y) {
		this.sx = x;
		this.sy = y;
		return this;
	}

	moveTo(x, y, skipAdd) {
		// 0, 1 maps to center + forward
		x *= this.sx;
		y *= this.sy;
		this.x = this.cx + this.fx * y - this.fy * x;
		this.y = this.cy + this.fy * y + this.fx * x;
		skipAdd || this.add();
		return this;
	}

	moveBy(x, y, skipAdd) {
		x *= this.sx;
		y *= this.sy;
		this.x += this.fx * y - this.fy * x;
		this.y += this.fy * y + this.fx * x;
		skipAdd || this.add();
		return this;
	}

	add() {
		this.xys.push([this.x, this.y]);
		return this;
	}

	create() {
		return new Path(this.xys, this.color.get());
	}
}

module.exports = PathCreator;
