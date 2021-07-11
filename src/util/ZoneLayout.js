import {randInt} from './number.js';

class ZoneLayout {
	constructor(width, height, zoneCount, density, strictDensity) {
		this.width = width;
		this.height = height;
		this.density = density;
		this.strictDensity = strictDensity;

		this.grid = [...Array(width)].map(() => [...Array(height)]);
		this.p = null;
		for (let i = 0; i < zoneCount; i++) {
			if (!this.p)
				this.startPath();
			if (!this.continuePath())
				this.endPath();
		}
	}

	getNeighbors(p) {
		return [
			[p[0] - 1, p[1]],
			[p[0] + 1, p[1]],
			[p[0], p[1] - 1],
			[p[0], p[1] + 1],
		];
	}

	isInBounds(p) {
		return p[0] >= 0 && p[0] < this.width && p[1] >= 0 && p[1] < this.height;
	}

	isRoom(p) {
		return this.grid[p[0]][p[1]];
	}

	setRoom(p, v) {
		return this.grid[p[0]][p[1]] = Math.max(v, this.grid[p[0]][p[1]] || 0);
	}

	startPath() {
		this.p = [randInt(this.width), randInt(this.height)];
		this.setRoom(this.p, 2);
	}

	continuePath() {
		let candidates = this.getNeighbors(this.p)
			.filter(p => this.isInBounds(p))
			.filter(p => !this.isRoom(p));
		let candidates2 = candidates
			.filter(p => this.getNeighbors(p)
				.filter(p => this.isInBounds(p))
				.filter(p => this.isRoom(p)).length < this.density);
		if (candidates2.length || this.strictDensity)
			candidates = candidates2;
		if (!candidates.length)
			return false;
		this.p = candidates[randInt(candidates.length)];
		this.setRoom(this.p, 1);
		return true;
	}

	endPath() {
		this.setRoom(this.p, 3);
		this.p = null;
	}
}

export default ZoneLayout;
