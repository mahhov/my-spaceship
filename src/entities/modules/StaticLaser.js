import Line from '../../painter/elements/Line.js';
import {Colors} from '../../util/Constants.js';
import makeEnum from '../../util/Enum.js';
import Vector from '../../util/Vector.js';
import Laser from '../attack/Laser.js';
import Module from './Module.js';

const Stages = makeEnum({WARNING: 0, ACTIVE: 0, INACTIVE: 0});

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

export default StaticLaser;
