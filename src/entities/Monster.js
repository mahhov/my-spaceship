const LivingEntity = require('./LivingEntity');
const Color = require('../util/Color');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const Phase = require('../util/Phase');
const {setMagnitude, thetaToUnitVector} = require('../util/Number');
const Projectile = require('./attack/Projectile');
const {UiCs, UiPs} = require('../UiConstants');
const Bar = require('../painter/Bar');

class Monster extends LivingEntity {
	constructor(x, y) {
		super(x, y, .04, .004, Color.fromHex(0x9, 0x0, 0x4, true), IntersectionFinderLayers.HOSTILE_UNIT);
		this.phase = new Phase(100, 100);
	}

	update(logic, intersectionFinder, player) {
		// let [dx, dy] = setMagnitude(Math.random() - .5, Math.random() - .5, 1);
		// this.safeMove(intersectionFinder, dx, dy, this.speed);

		if (this.phase.complete())
			this.phase.nextPhase();

		if (this.phase.tick() === 1)
			return;

		let [dx, dy] = setMagnitude(player.x - this.x, player.y - this.y, .015);
		let [rdx, rdy] = setMagnitude(...thetaToUnitVector(Math.random() * Math.PI * 2), .0015 * Math.random());

		let projectile = new Projectile(this.x, this.y, .01, .01, dx + rdx, dy + rdy, 100, .005, false);
		logic.addProjectile(projectile);
	}

	paintUi(painter) {
		painter.add(new Bar(UiPs.MARGIN, UiPs.MARGIN, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT, this.currentHealth, UiCs.LIFE_EMPTY_COLOR.get(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_EMPTY_COLOR.get()));
	}
}

module.exports = Monster;
