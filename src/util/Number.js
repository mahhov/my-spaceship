const EPSILON = 1e-10;

const maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

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

const thetaToUnitVector = theta => [Math.cos(theta), Math.sin(theta)];

module.exports = {EPSILON, maxWhich, getMagnitude, setMagnitude, clamp, thetaToUnitVector};
