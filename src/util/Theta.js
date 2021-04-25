import {cos, sin} from './Number.js';

class Theta {
	constructor(theta) {
		this.theta = theta;
		this.cos = cos(theta);
		this.sin = sin(theta);
	}
}

export default Theta;
