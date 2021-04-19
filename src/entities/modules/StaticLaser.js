const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');
const Laser = require('../attack/Laser');
const {Colors} = require('../../util/Constants');
const Line = require('../../painter/elements/Line');

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
		painter.add(Line.withCamera(
			camera,
			this.origin.x, this.origin.y,
			warning.x, warning.y,
			this.size,
			{color: Colors.Entity.AREA_DEGEN.WARNING_BORDER.get()}));
	}
}

StaticLaser.Stages = Stages;

module.exports = StaticLaser;
