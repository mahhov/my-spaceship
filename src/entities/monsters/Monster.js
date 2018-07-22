const LivingEntity = require('../LivingEntity');
const {IntersectionFinderLayers} = require('../../intersection/IntersectionFinder');

class Monster extends LivingEntity {
	constructor(x, y, width, height, speed, health, color) {
		super(x, y, width, height, speed, health, color, IntersectionFinderLayers.HOSTILE_UNIT)
	}
}

module.exports = Monster;
