const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const Color = require('../util/Color');
const RockGraphics = require('../graphics/RockGraphic');

class Rock extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphics(size, size, {fill: true, color: Color.fromHex(0xf, 0xf, 0xf, true).get()}));
	}
}

module.exports = Rock;
