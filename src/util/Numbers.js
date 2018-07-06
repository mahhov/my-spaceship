const EPSILON = 1e-10;

let maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

let getMagnitude = (x, y) =>
	Math.sqrt(x * x + y * y);

let setMagnitude = (x, y, magnitude = 1) => {
	let prevMagnitude = getMagnitude(x, y);
	let mult = magnitude / prevMagnitude;
	return [x * mult, y * mult, prevMagnitude];
};

module.exports = {EPSILON, maxWhich, getMagnitude, setMagnitude};
