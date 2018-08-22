const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const OutpostPortalGraphic = require('../../graphics/OutpostPortalGraphic');

const ShotgunWarrior = require('./ShotgunWarrior');
const {rand, randVector} = require('../../util/Number');

class OutpostPortal extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new OutpostPortalGraphic(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));
	}

	update(map, intersectionFinder, monsterKnowledge) {
		// todo [high] make this into a spawn module
		if (Math.random() > .005)
			return;
		let turrets = 3 + rand(3);
		for (let i = 0; i < turrets; i++) {
			let spawnVector = randVector(.2);
			let shotgunWarrior = new ShotgunWarrior(this.x + spawnVector[0], this.y + spawnVector[1]);
			map.addMonster(shotgunWarrior);
		}
	}
}

module.exports = OutpostPortal;
