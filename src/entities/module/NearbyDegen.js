const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {getRectDistance} = require('../../util/Number');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');

const Stages = makeEnum('WARNING', 'ACTIVE', 'INACTIVE');

class NearbyDegen extends Module {
	config(origin, range, damage) {
		this.origin = origin;
		this.range = range;
		this.damage = damage;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;
		let targetDistance = getRectDistance(target.x - this.origin.x, target.y - this.origin.y);
		if (targetDistance < this.range)
			target.changeHealth(-this.damage);
	}

	paint(painter, camera) {
		if (this.stage === Stages.INACTIVE)
			return;
		let graphicOptions = this.stage === Stages.WARNING ?
			{color: Colors.Ability.NearbyDegen.WARNING_BORDER.get()} :
			{fill: true, color: Colors.Ability.NearbyDegen.ACTIVE_FILL.get()};
		painter.add(RectC.withCamera(camera,
			this.origin.x, this.origin.y,
			this.range * 2, this.range * 2,
			graphicOptions));
	}
}

NearbyDegen.Stages = Stages;

module.exports = NearbyDegen;
