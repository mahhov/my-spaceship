import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Rect from '../../painter/elements/Rect.js';
import {Colors} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import {getRectDistance} from '../../util/Number.js';
import Entity from '../Entity.js';

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
		let coordinate = new Coordinate(this.x, this.y, this.range * 2).align(Coordinate.Aligns.CENTER);
		painter.add(Rect.withCamera(camera, coordinate, {color: Colors.Entity.Bomb.WARNING_BORDER.get()}));
		coordinate = new Coordinate(this.x, this.y, this.width, this.height).align(Coordinate.Aligns.CENTER);
		painter.add(Rect.withCamera(camera, coordinate, {color: Colors.Entity.Bomb.ENTITY.get()}));
	}
}

export default Bomb;
