const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {UiCs} = require('../util/UiConstants');
const RockGraphics = require('../graphics/RockGraphic');

class RockMineral extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphics(size, size, {fill: true, color: UiCs.Entity.ROCK_MINERAL.get()}));
	}
}

module.exports = RockMineral;