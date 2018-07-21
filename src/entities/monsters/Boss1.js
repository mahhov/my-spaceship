const Monster = require('./Monster');
const Color = require('../../util/Color');
const Phase = require('../../util/Phase');
const StarShip = require('../../graphics/StarShip');
const {getRectDistance, getMagnitude, setMagnitude, thetaToUnitVector} = require('../../util/Number');
const Projectile = require('../attack/Projectile');
const {UiCs, UiPs} = require('../../UiConstants');
const RectC = require('../../painter/RectC');
const Bar = require('../../painter/Bar');

const PRE_DEGEN_PHASE = 0, DEGEN_PHASE = 2, PROJECTILE_PHASE = 3;
const DEGEN_RANGE = .33;

class Boss1 extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .004, Color.fromHex(0x9, 0x0, 0x4, true));
		this.attackPhase = new Phase(100, 100, 200);
		this.enragePhase = new Phase(6000);
		this.enragePhase.setPhase(0);
		this.ship = new StarShip(this.width, this.height, {fill: true, color: this.color.get()});
	}

	isEnraged() {
		return this.enragePhase.isComplete();
	}

	update(logic, intersectionFinder, player) {
		this.attackPhase.sequentialTick();
		this.enragePhase.tick();

		if (this.attackPhase.get() === DEGEN_PHASE)
			this.distanceDegen(logic, intersectionFinder, player);
		else if (this.attackPhase.get() === PROJECTILE_PHASE)
			this.projecitlePhase(logic, intersectionFinder, player);
	}

	distanceDegen(logic, intersectionFinder, player) {
		let playerDistance = getRectDistance(player.x - this.x, player.y - this.y);
		if (playerDistance < DEGEN_RANGE)
			player.changeHealth(-.002 * (this.isEnraged() * 4 + 1));
	}

	projecitlePhase(logic, intersectionFinder, player) {
		if (!this.isEnraged() && Math.random() > .1)
			return;

		for (let i = 0; i < 10; i++) {
			let [dx, dy] = setMagnitude(player.x - this.x, player.y - this.y, .015);
			let spread = .003 * (this.isEnraged() * 2 + 1);
			let [rdx, rdy] = setMagnitude(...thetaToUnitVector(Math.random() * Math.PI * 2), Math.random() * spread);

			let projectile = new Projectile(this.x, this.y, .01, .01, dx + rdx, dy + rdy, 100, .005, false);
			logic.addProjectile(projectile);
		}
	}

	paint(painter, camera) {
		this.ship.paint(painter, camera, this.x, this.y, [0, 1]);

		if (this.attackPhase.get() === PRE_DEGEN_PHASE)
			painter.add(RectC.withCamera(camera, this.x, this.y, DEGEN_RANGE * 2, DEGEN_RANGE * 2, {color: Color.from1(1, 0, 0).get()}));
		else if (this.attackPhase.get() === DEGEN_PHASE)
			painter.add(RectC.withCamera(camera, this.x, this.y, DEGEN_RANGE * 2, DEGEN_RANGE * 2, {fill: true, color: Color.from1(1, 0, 0, .3).get()}));
	}

	paintUi(painter, camera) {
		painter.add(new Bar(
			UiPs.MARGIN, UiPs.MARGIN, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT, this.currentHealth,
			UiCs.LIFE_COLOR.getShade(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.getShade()));
		painter.add(new Bar(
			UiPs.MARGIN, UiPs.MARGIN * 2.5, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT * .5, this.enragePhase.getRatio(),
			UiCs.ENRAGE_COLOR.getShade(), UiCs.ENRAGE_COLOR.get(), UiCs.ENRAGE_COLOR.getShade()));
	}
}

module.exports = Boss1;
