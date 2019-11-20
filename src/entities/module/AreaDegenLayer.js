const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const AreaDegen = require('../attack/AreaDegen');

const Stages = makeEnum('WARNING', 'ACTIVE', 'INACTIVE');

class AreaDegenLayer extends Module {
	config(origin, range, duration, damage) {
		this.origin = origin;
		this.range = range;
		this.duration = duration;
		this.damage = damage;
		this.warningAreaDegen = this.areaDegen;
	}

	get areaDegen() {
		return new AreaDegen(this.origin.x, this.origin.y, this.range, this.duration, this.damage, false)
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.WARNING)
			this.warningAreaDegen.setPosition(this.origin.x, this.origin.y);
		else if (this.stage === Stages.ACTIVE)
			map.addProjectile(this.areaDegen);
	}

	paint(painter, camera) {
		if (this.stage === Stages.WARNING)
			this.warningAreaDegen.paint(painter, camera, true);

	}
}

AreaDegenLayer.Stages = Stages;

module.exports = AreaDegenLayer;
