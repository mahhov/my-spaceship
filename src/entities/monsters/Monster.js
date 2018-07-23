const LivingEntity = require('../LivingEntity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');

class Monster extends LivingEntity {
	constructor(x, y, width, height, speed, health, color) {
		super(x, y, width, height, speed, health, color, IntersectionFinder.Layers.HOSTILE_UNIT)
	}
}

module.exports = Monster;
