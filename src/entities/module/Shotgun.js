const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude, randVector} = require('../../util/Number');
const Projectile = require('../attack/Projectile');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Shotgun extends Module {
	config(origin, rate, count, velocity, spread, duration, damage) {
		this.origin = origin;
		this.rate = rate;
		this.count = count;
		this.velicity = velocity;
		this.spread = spread;
		this.duration = duration;
		this.damage = damage;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE || Math.random() > this.rate)
			return;

		for (let i = 0; i < this.count; i++) {
			let directv = setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.velicity);
			let randv = randVector(this.spread);

			let projectile = new Projectile(this.origin.x, this.origin.y, .01, .01, directv.x + randv[0], directv.y + randv[1], this.duration, this.damage, false);
			map.addProjectile(projectile);
		}
	}
}

Shotgun.Stages = Stages;

module.exports = Shotgun;
