const EPSILON = 1e-10;

let maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

module.exports = {EPSILON, maxWhich};
