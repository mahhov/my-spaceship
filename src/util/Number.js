const EPSILON = 1e-10, PI = Math.PI, PI2 = PI * 2;

const minWhich = (i, j) => i < j ? [i, 0] : [j, 1];

const maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

const minWhichA = arr => arr.reduce((maxI, v, i, a) => v < a[maxI] ? i : maxI, 0);

const maxWhichA = arr => arr.reduce((maxI, v, i, a) => v > a[maxI] ? i : maxI, 0);

const getDiamondDistance = (x, y) => Math.abs(x) + Math.abs(y);

const getRectDistance = (x, y) => Math.max(Math.abs(x), Math.abs(y));

// todo [medium] deprecated
// todo [medium] replace getMagnitude uses with getMagnitudeSqr where possible
const getMagnitudeSqr = ({x, y}) => x * x + y * y;

// todo [medium] deprecated
const getMagnitude = (x, y) => Math.sqrt(getMagnitudeSqr({x, y}));

// todo [medium] deprecated
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

// todo [medium] deprecated
const thetaToVector = (theta, magnitude = 1) => [cos(theta) * magnitude, sin(theta) * magnitude];

const cos = theta => Math.cos(theta);

const sin = theta => Math.sin(theta);

const booleanArray = array => array.some(a => a);

const avg = (a, b, weight = .5) => a * weight + b * (1 - weight);

// [0, int)
const rand = (max = 1) => Math.random() * max;

const randB = (max = 1) => rand(max) - max / 2;

// [0, max)
const randInt = max => Math.floor(rand(max));

// todo [medium] deprecated
const randVector = magnitude =>
	thetaToVector(rand(PI2), rand(magnitude));

// todo [medium] deprecated
const vectorDelta = (a, b) => ({x: b.x - a.x, y: b.y - a.y});

// todo [medium] deprecated
const vectorSum = (...vs) =>
	vs.reduce((v, sum) => ({x: sum.x + v.x, y: sum.y + v.y}), {x: 0, y: 0});

const round = (number, precision = 0) => {
	let ten = 10 ** precision;
	return Math.round(number * ten) / ten;
};

module.exports = {
	EPSILON,
	PI,
	PI2,
	minWhich,
	maxWhich,
	minWhichA,
	maxWhichA,
	getDiamondDistance,
	getRectDistance,
	getMagnitudeSqr,
	getMagnitude,
	setMagnitude,
	clamp,
	thetaToVector,
	cos,
	sin,
	booleanArray,
	avg,
	rand,
	randB,
	randInt,
	randVector,
	vectorDelta,
	vectorSum,
	round,
};

// todo [medium] consistent return {x, y} for vectors instead of [x, y] for some
// todo [medium] consistent input ({x, y}) for vectors instead of (x, y)
