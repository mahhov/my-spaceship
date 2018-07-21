const LivingEntity = require('../LivingEntity');
const {IntersectionFinderLayers} = require('../../intersection/IntersectionFinder');

class Monster extends LivingEntity {
	constructor(x, y, width, height, speed, color) {
		super(x, y, width, height, speed, color, IntersectionFinderLayers.HOSTILE_UNIT)
	}
}

module.exports = Monster;
