const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
const RockGraphic = require('../../graphics/RockGraphic');
const Buff = require('../Buff');
const Vector = require('../../util/Vector');
const {minWhichA, randInt} = require('../../util/Number');
const RectC = require('../../painter/RectC');

class Egg extends Entity {
	constructor(possiblePositions) {
		const size = .1;
		super(0, 0, size, size, IntersectionFinder.Layers.UNIT_TRACKER);
		this.possiblePositions = possiblePositions;
		this.randomPosition();
		this.setGraphics(new RockGraphic(size, size, {fill: true, color: Colors.Entity.EGG.get()}));
		this.slowDebuff = new Buff(0, Colors.Entity.EGG, 'EGG');
		this.slowDebuff.moveSpeed = -.3;
		this.slowDebuff.attackRange = -.3;
	}

	randomPosition() {
		let {x, y} = this.possiblePositions[randInt(this.possiblePositions.length)];
		this.setPosition(x, y);
	}

	update(map) {
		if (this.ownerHero && !this.ownerHero.health.isEmpty())
			this.ownerHero.changeHealth(-.003);

		if (this.ownerHero && this.ownerHero.health.isEmpty()) {
			this.ownerHero = null;
			this.randomPosition();
			this.slowDebuff.expire();
		}

		if (!this.ownerHero) {
			if (this.queuedTrackedIntersections[0]) {
				this.ownerHero = this.queuedTrackedIntersections[0];
				this.queuedTrackedIntersections = [];
				this.slowDebuff.reset();
				this.ownerHero.addBuff(this.slowDebuff);
			}
		}
	}

	paint(painter, camera) {
		if (!this.ownerHero)
			super.paint(painter, camera);
		else
			painter.add(RectC.withCamera(camera, this.ownerHero.x, this.ownerHero.y, this.width, this.height, {fill: false, color: Colors.Entity.EGG.get()}));
	}
}

module.exports = Egg;
