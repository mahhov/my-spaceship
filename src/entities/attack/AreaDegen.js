const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {getRectDistance} = require('../../util/Number');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');

class AreaDegen extends Entity {
	// if maxTargets <= 0, will be treated as infinite
	constructor(x, y, range, time, damage, friendly) {
		super(x, y, range, range, IntersectionFinder.Layers.IGNORE);
		// We use Layers.IGNORE for calling super() in order to avoid blocking unit moving.
		// Todo [high] the layer_ hack won't be needed once intersection finder implements un-symmetric collisions
		this.layer_ = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		this.range = range;
		this.time = time; // -1 will be infinite, 0 will be 1 tick
		this.damage = damage;
	}

	update(map, intersectionFinder) {
		intersectionFinder.intersections(this.layer_, this.bounds)
			.forEach(monster => monster.changeHealth(-this.damage));
		return !this.time--;
	}

	paint(painter, camera, warning = false) {
		let graphicOptions = warning ?
			{color: Colors.Entity.AREA_DEGEN.WARNING_BORDER.get()} :
			{fill: true, color: Colors.Entity.AREA_DEGEN.ACTIVE_FILL.get()};
		painter.add(RectC.withCamera(camera,
			this.x, this.y,
			this.range * 2, this.range * 2,
			graphicOptions));
	}
}

module.exports = AreaDegen;
