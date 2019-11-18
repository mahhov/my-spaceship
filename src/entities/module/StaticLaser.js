const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude, randVector} = require('../../util/Number');
const Vector = require('../../util/Vector');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');
const Laser = require('../attack/Laser');

const Stages = makeEnum('WARNING', 'ACTIVE', 'INACTIVE');

class StaticLaser extends Module {
	config(origin, spread, range, dirModule, duration, damage, size = .02) {
		this.origin = origin;
		this.spread = spread;
		this.range = range;
		this.duration = duration;
		this.damage = damage;
		this.size = size;
		this.dirModule = dirModule;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let dir = Vector.fromRand(this.spread).add(this.dirModule.dir);

		let laser = new Laser(
			this.origin.x, this.origin.y,
			dir.x, dir.y,
			this.size, this.duration, this.damage, false);
		map.addProjectile(laser);
	}

	paint(painter, camera) {
		if (this.stage !== Stages.WARNING)
			return;
	  let warning = Vector.fromObj(this.origin).add(this.dirModule.dir);
		painter.add(RectC.withCamera(camera, warning.x, warning.y, .01, .01, {color: Colors.Ability.NearbyDegen.WARNING_BORDER.get()}));
	}
}

StaticLaser.Stages = Stages;

module.exports = StaticLaser;
