const Monster = require('./Monster');
const Color = require('../../util/Color');
const Phase = require('../../util/Phase');
const StarShip = require('../../graphics/StarShip');
const {getRectDistance} = require('../../util/Number');
const {UiCs, UiPs} = require('../../UiConstants'); // todo remove if not used
const RectC = require('../../painter/RectC');
const Bar = require('../../painter/Bar'); // todo remove if not used

const REST_PHASE = 0, ATTACK_PHASE = 1;
const DEGEN_RANGE = .4;

class Turret extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .004, Color.fromHex(0x9, 0x0, 0x4, true));
		this.attackPhase = new Phase(200, 200);
		this.ship = new StarShip(this.width, this.height, {fill: true, color: this.color.get()});
	}

	update(logic, intersectionFinder, player) {
		this.attackPhase.sequentialTick();

		if (this.attackPhase.get() === ATTACK_PHASE)
			this.distanceDegen(logic, intersectionFinder, player);
	}

	distanceDegen(logic, intersectionFinder, player) {
		let playerDistance = getRectDistance(player.x - this.x, player.y - this.y);
		if (playerDistance < DEGEN_RANGE)
			player.changeHealth(-.001);
	}

	paint(painter, camera) {
		this.ship.paint(painter, camera, this.x, this.y, [0, 1]);

		if (this.attackPhase.get() === REST_PHASE)
			painter.add(RectC.withCamera(camera, this.x, this.y, DEGEN_RANGE * 2, DEGEN_RANGE * 2, {color: Color.from1(1, 0, 0).get()}));
		else if (this.attackPhase.get() === ATTACK_PHASE)
			painter.add(RectC.withCamera(camera, this.x, this.y, DEGEN_RANGE * 2, DEGEN_RANGE * 2, {fill: true, color: Color.from1(1, 0, 0, .3).get()}));
	}
}

module.exports = Turret;


// todo
// make degen turret
// customizable health
// offset phasing
// make shotgun warrior
// modularize monster
