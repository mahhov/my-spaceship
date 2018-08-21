const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors} = require('../util/Constants');
const RockGraphics = require('../graphics/RockGraphic');

class Rock extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphics(size, size, {fill: true, color: Colors.Entity.ROCK.get()}));
	}
}

module.exports = Rock;
