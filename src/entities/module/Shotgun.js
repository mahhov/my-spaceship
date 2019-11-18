const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude, randVector} = require('../../util/Number');
const Projectile = require('../attack/Projectile');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Shotgun extends Module {
	config(origin, rate, count, velocity, spread, duration, damage, predictableRate = false, size = .02, dir = null) {
		this.origin = origin;
		this.rate = rate;
		this.count = count;
		this.velocity = velocity;
		this.spread = spread;
		this.duration = duration;
		this.damage = damage;
		this.predictableRate = predictableRate;
		this.size = size;
		this.dir = dir && setMagnitude(dir.x, dir.y, velocity); // if null, directs towards target
		this.rateCurrent = 0;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;
		if (!this.predictableRate && Math.random() > this.rate)
			return;
		if (this.predictableRate && (this.rateCurrent += this.rate) < 1)
			return;
		this.rateCurrent--;

		for (let i = 0; i < this.count; i++) {
			let directv = this.dir || setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.velocity);
			let randv = randVector(this.spread);

			let projectile = new Projectile(
				this.origin.x, this.origin.y,
				this.size, this.size,
				directv.x + randv[0], directv.y + randv[1],
				this.duration, this.damage, false);
			map.addProjectile(projectile);
		}
	}
}

Shotgun.Stages = Stages;

module.exports = Shotgun;
