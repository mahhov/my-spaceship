const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const OutpostPortalGraphic = require('../../graphics/OutpostPortalGraphic');

class OutpostPortal extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new OutpostPortalGraphic(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));
	}

	update(map, intersectionFinder, monsterKnowledge) {
	}
}

module.exports = OutpostPortal;
