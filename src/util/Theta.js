const {cos, sin} = require('./Number');

class Theta {
	constructor(theta) {
		this.theta = theta;
		this.cos = cos(theta);
		this.sin = sin(theta);
	}
}

module.exports = Theta;
