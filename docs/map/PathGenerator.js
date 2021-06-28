import {getMagnitude, getMagnitudeSqr, rand, randVector, setMagnitude, vectorDelta, vectorSum} from '../util/number.js';

class PathGenerator {
	// weightPower [0, 1)
	// distPower [1, infinity)
	// randPower [0, 1)
	constructor(width, height, weightNum, weightPower = .9, distPower = 10, randPower = .1) {
		this.width = width;
		this.height = height;
		this.weightPower = weightPower;
		this.distPower = distPower;
		this.randPower = randPower;

		// create weights
		this.weights = [];
		for (let i = 0; i < weightNum; i++)
			this.weights.push({x: rand(width), y: rand(height), value: rand()});
	}

	randPerimeter() {
		let index = rand((this.width + this.height) * 2);
		let side = 0;

		let incrementSide = sideLength => {
			if (index < sideLength)
				return true;
			side++;
			index -= sideLength;
		};
		incrementSide(this.width) &&
		incrementSide(this.height) &&
		incrementSide(this.width) &&
		incrementSide(this.height);

		switch (side) {
			case 0: // left
				return {x: 0, y: index, side};
			case 1: // top
				return {x: index, y: 0, side};
			case 2: // right
				return {x: width - 1, y: index, side};
			case 3: // bottom
				return {x: index, y: height - 1, side};
		}
	};

	createPathEndpoints() {
		let start, end;
		do {
			start = this.randPerimeter();
			end = this.randPerimeter();
		} while (start.side === end.side);
		return {start, end};
	}

	weightVector(point) {
		let maxWeightValue = 0, maxWeightDelta;
		this.weights.forEach(weight => {
			let delta = vectorDelta(point, weight);
			let distance = getMagnitude(delta.x, delta.y);
			let value = weight.value * (1 + this.distPower) / (distance + 1 + this.distPower);
			if (value >= maxWeightValue) {
				maxWeightValue = value;
				maxWeightDelta = delta;
			}
		});

		return setMagnitude(maxWeightDelta.x, maxWeightDelta.y, maxWeightValue * this.weightPower);
	}

	updatePath(point, end) {
		let delta = vectorDelta(point, end);
		if (getMagnitudeSqr(delta) < 10)
			return delta;
		delta = setMagnitude(delta.x, delta.y);
		let weightVector = this.weightVector(point);
		let randV = randVector(this.randPower);
		let sum = vectorSum(delta, weightVector, {x: randV[0], y: randV[1]});
		return setMagnitude(sum.x, sum.y);
	}
}

export default PathGenerator;
