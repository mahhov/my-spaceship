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
		super(0, 0, size, size, IntersectionFinder.Layers.PASSIVE);
		this.possiblePositions = possiblePositions;
		this.randomPosition();
		this.setGraphics(new RockGraphic(size, size, {fill: true, color: Colors.Entity.EGG.get()}));
		this.slowDebuff = new Buff(0, Colors.Entity.EGG, 'SLOW');
		this.slowDebuff.moveSpeed = -.2;
	}

	randomPosition() {
		let {x, y} = this.possiblePositions[randInt(this.possiblePositions.length)];
		this.setPosition(x, y);
	}

	update(map) {
		if (this.ownerHero && this.ownerHero.health.isEmpty()) {
			this.ownerHero = null;
			this.randomPosition();
			this.slowDebuff.expire();
		}

		if (!this.ownerHero) {
			let pos = Vector.fromObj(this);
			let heroes = map.heroes;
			let deltaMagnitudeSqrs = heroes.map(hero => Vector.fromObj(hero).subtract(pos).magnitudeSqr);
			let closestHeroI = minWhichA(deltaMagnitudeSqrs);
			if (deltaMagnitudeSqrs[closestHeroI] < .01) {
				this.ownerHero = heroes[closestHeroI];
				this.slowDebuff.reset();
				this.ownerHero.addBuff(this.slowDebuff);
			}
		}

		// todo [high] avoid collisions when picked up
		// todo [high] consider using intersection finder instead of computing distances
		// todo [high] update score
	}

	paint(painter, camera) {
		if (!this.ownerHero)
			super.paint(painter, camera);
		else
			painter.add(RectC.withCamera(camera, this.ownerHero.x, this.ownerHero.y, this.width, this.height, {fill: false, color: Colors.Entity.EGG.get()}));
	}
}

module.exports = Egg;
