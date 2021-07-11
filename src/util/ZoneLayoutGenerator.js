import {randInt} from './number.js';
import ZoneLayout from './ZoneLayout.js';

class ZoneLayoutGenerator {
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

		return new ZoneLayout(this.grid);
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

	isZone(p) {
		return this.grid[p[0]][p[1]];
	}

	setZone(p, v) {
		return this.grid[p[0]][p[1]] = Math.max(v, this.grid[p[0]][p[1]] || 0);
	}

	startPath() {
		this.p = [randInt(this.width), randInt(this.height)];
		this.setZone(this.p, 2);
	}

	continuePath() {
		let candidates = this.getNeighbors(this.p)
			.filter(p => this.isInBounds(p))
			.filter(p => !this.isZone(p));
		let candidates2 = candidates
			.filter(p => this.getNeighbors(p)
				.filter(p => this.isInBounds(p))
				.filter(p => this.isZone(p)).length < this.density);
		if (candidates2.length || this.strictDensity)
			candidates = candidates2;
		if (!candidates.length)
			return false;
		this.p = candidates[randInt(candidates.length)];
		this.setZone(this.p, 1);
		return true;
	}

	endPath() {
		this.setZone(this.p, 3);
		this.p = null;
	}
}

export default ZoneLayoutGenerator;
