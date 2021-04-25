import Graphics from './Graphics.js';

class RotatingTurretShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();

		const MIDDLE = 8;
		const SMALL = 9;
		const LARGE_WIDTH = 7;
		const LARGE_HEIGHT = 17;

		let scale = width / (MIDDLE + SMALL) / 4 + height / (MIDDLE + MIDDLE + SMALL + LARGE_HEIGHT) / 2;

		let middleS = MIDDLE * scale;
		let smallS = SMALL * scale;
		let largeWidthS = LARGE_WIDTH * scale;
		let largeHeightS = LARGE_HEIGHT * scale;

		let rect = [
			[-1, -1],
			[-1, 1],
			[1, 1],
			[1, -1]];

		// left
		this.addPathXY(
			-middleS - smallS / 2,
			0,
			smallS,
			smallS,
			rect,
			true,
			graphicOptions);
		// right
		this.addPathXY(
			middleS + smallS / 2,
			0,
			smallS,
			smallS,
			rect,
			true,
			graphicOptions);
		// front
		this.addPathXY(
			0,
			middleS + smallS / 2,
			smallS,
			smallS,
			rect,
			true,
			graphicOptions);
		// back
		this.addPathXY(
			0,
			-middleS - largeHeightS / 2,
			largeWidthS,
			largeHeightS,
			rect,
			true,
			graphicOptions);
	}
}

export default RotatingTurretShip;
