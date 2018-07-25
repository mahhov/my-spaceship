const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {getRectDistance} = require('../../util/Number');
const Color = require('../../util/Color');
const RectC = require('../../painter/RectC');

const Stages = makeEnum('PRE', 'ACTIVE', 'INACTIVE');

class NearbyDegen extends Module {
	config(range, damage, origin) {
		this.range = range;
		this.damage = damage;
		this.origin = origin;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;
		let targetDistance = getRectDistance(target.x - this.origin.x, target.y - this.origin.y);
		if (targetDistance < this.range)
			target.changeHealth(-this.damage);
	}

	paint(painter, camera) {
		if (this.stage === Stages.PRE)
			painter.add(RectC.withCamera(camera, this.origin.x, this.origin.y, this.range * 2, this.range * 2, {color: Color.from1(1, 0, 0).get()}));
		else if (this.stage === Stages.ACTIVE)
			painter.add(RectC.withCamera(camera, this.origin.x, this.origin.y, this.range * 2, this.range * 2, {fill: true, color: Color.from1(1, 0, 0, .3).get()}));
	}
}

NearbyDegen.Stages = Stages;

module.exports = NearbyDegen;
