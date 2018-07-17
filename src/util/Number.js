const EPSILON = 1e-10;

const maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

const getDiamondDistance = (x, y) => Math.abs(x) + Math.abs(y);

const getRectDistance = (x, y) => Math.max(Math.abs(x), Math.abs(y));

const getMagnitude = (x, y) =>
	Math.sqrt(x * x + y * y);

const setMagnitude = (x, y, magnitude = 1) => {
	let prevMagnitude = getMagnitude(x, y);
	if (!prevMagnitude)
		return [magnitude, 0, 0];
	let mult = magnitude / prevMagnitude;
	return [x * mult, y * mult, prevMagnitude];
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

module.exports = {EPSILON, maxWhich, getDiamondDistance, getRectDistance, getMagnitude, setMagnitude, clamp, thetaToUnitVector, cos, sin, booleanArray};
