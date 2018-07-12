const LivingEntity = require('./LivingEntity');
const Color = require('../util/Color');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const {setMagnitude} = require('../util/Number');
const Projectile = require('./attack/Projectile');
const {UiCs, UiPs} = require('../UiConstants');
const Bar = require('../painter/Bar');

class Monster extends LivingEntity {
	constructor(x, y) {
		super(x, y, .04, .004, Color.fromHex(0x9, 0x0, 0x4, true), IntersectionFinderLayers.HOSTILE_UNIT);
	}

	update(logic, intersectionFinder) {
		let [dx, dy] = setMagnitude(Math.random() - .5, Math.random() - .5, 1);
		this.safeMove(intersectionFinder, dx, dy, this.speed);

		let projectile = new Projectile(this.x, this.y, .01, .01, dx * .01, dy * .01, 100, .005, false);
		logic.addProjectile(projectile);
	}

	paintUi(painter) {
		painter.add(new Bar(UiPs.MARGIN, UiPs.MARGIN, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT, this.currentHealth, UiCs.LIFE_EMPTY_COLOR.get(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_EMPTY_COLOR.get()));
	}
}

module.exports = Monster;
