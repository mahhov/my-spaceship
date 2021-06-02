import Entity from '../Entity.js';
import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import {Colors} from '../../util/Constants.js';
import RockGraphic from '../../graphics/RockGraphic.js';
import Buff from '../Buff.js';
import {randInt} from '../../util/Number.js';
import Rect from '../../painter/elements/Rect.js';

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
			this.ownerHero.changeHealth(-.001);

		if (this.ownerHero && this.ownerHero.health.isEmpty()) {
			this.ownerHero = null;
			this.randomPosition();
			this.slowDebuff.expire();
			this.queuedTrackedIntersections = [];
		}

		if (!this.ownerHero && this.queuedTrackedIntersections[0]) {
			this.ownerHero = this.queuedTrackedIntersections[0];
			this.slowDebuff.reset();
			this.ownerHero.addBuff(this.slowDebuff);
		}
	}

	paint(painter, camera) {
		if (!this.ownerHero)
			super.paint(painter, camera);
		else
			painter.add(Rect.centeredRectWithCamera(camera, this.ownerHero.x, this.ownerHero.y, this.width, this.height, {fill: false, color: Colors.Entity.EGG.get()}));
	}
}

export default Egg;
