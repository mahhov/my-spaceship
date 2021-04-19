const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {getRectDistance} = require('../../util/Number');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/elements/RectC');

class Bomb extends Entity {
	// if maxTargets <= 0, will be treated as infinite
	constructor(x, y, width, height, range, time, damage, maxTargets, friendly) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, width, height, layer);
		this.range = range;
		this.time = time;
		this.damage = damage;
		this.maxTargets = maxTargets;
	}

	update(map, intersectionFinder) {
		if (this.time--)
			return;

		let targetsCount = this.maxTargets;
		map.monsters.find(monster => {
			let targetDistance = getRectDistance(monster.x - this.x, monster.y - this.y);
			if (targetDistance < this.range) {
				monster.changeHealth(-this.damage);
				return !--targetsCount;
			}
		});

		return true;
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.range * 2, this.range * 2, {color: Colors.Entity.Bomb.WARNING_BORDER.get()}));
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {color: Colors.Entity.Bomb.ENTITY.get()}));
	}
}

module.exports = Bomb;
