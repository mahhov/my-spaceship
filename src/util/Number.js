const EPSILON = 1e-10;

const maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

const getDiamondDistance = (x, y) => Math.abs(x) + Math.abs(y);

const getRectDistance = (x, y) => Math.max(Math.abs(x), Math.abs(y));

const getMagnitude = (x, y) =>
	Math.sqrt(x * x + y * y);

const setMagnitude = (x, y, magnitude = 1) => {
	let prevMagnitude = getMagnitude(x, y);
	if (!prevMagnitude)
		return {x: magnitude, y: 0, prevMagnitude};
	let mult = magnitude / prevMagnitude;
	return {x: x * mult, y: y * mult, prevMagnitude};
};

const clamp = (x, min, max) => {
	if (x < min)
		return min;
	return x > max ? max : x;
};

const thetaToUnitVector = theta => [cos(theta), sin(theta)];

const cos = theta => Math.cos(theta);

const sin = theta => Math.sin(theta);

const booleanArray = array => array.some(a => a);

const avg = (a, b, weight = .5) => a * weight + b * (1 - weight);

const rand = (max = 1) => Math.random() * max;

const randB = (max = 1) => Math.random() * max - max / 2;

const randInt = max => parseInt(rand(max));

module.exports = {EPSILON, maxWhich, getDiamondDistance, getRectDistance, getMagnitude, setMagnitude, clamp, thetaToUnitVector, cos, sin, booleanArray, avg, rand, randB, randInt};
