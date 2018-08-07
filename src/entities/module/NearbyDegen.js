const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {getRectDistance} = require('../../util/Number');
const {UiCs} = require('../../util/UiConstants');
const RectC = require('../../painter/RectC');

const Stages = makeEnum('WARNING', 'ACTIVE', 'INACTIVE');

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
		if (this.stage === Stages.WARNING)
			painter.add(RectC.withCamera(camera, this.origin.x, this.origin.y, this.range * 2, this.range * 2, {color: UiCs.Ability.NearybyDegen.WARNING_BORDER.get()}));
		else if (this.stage === Stages.ACTIVE)
			painter.add(RectC.withCamera(camera, this.origin.x, this.origin.y, this.range * 2, this.range * 2, {fill: true, color: UiCs.Ability.NearybyDegen.ACTIVE_FILL.get()}));
	}
}

NearbyDegen.Stages = Stages;

module.exports = NearbyDegen;
