const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude, thetaToUnitVector} = require('../../util/Number');
const Projectile = require('../attack/Projectile');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Shotgun extends Module {
	config(rate, count, velocity, spread, duration, damage, origin) {
		this.rate = rate;
		this.count = count;
		this.velicity = velocity;
		this.spread = spread;
		this.duration = duration;
		this.damage = damage;
		this.origin = origin;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE || Math.random() > this.rate)
			return;

		for (let i = 0; i < this.count; i++) {
			let [dx, dy] = setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.velicity);
			let [rdx, rdy] = setMagnitude(...thetaToUnitVector(Math.random() * Math.PI * 2), Math.random() * this.spread);

			let projectile = new Projectile(this.origin.x, this.origin.y, .01, .01, dx + rdx, dy + rdy, this.duration, this.damage, false);
			map.addProjectile(projectile);
		}
	}
}

Shotgun.Stages = Stages;

module.exports = Shotgun;
