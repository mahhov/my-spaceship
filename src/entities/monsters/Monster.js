import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Bar from '../../painter/elements/Bar.js';
import BaseStats from '../../playerData/BaseStats.js';
import Stat from '../../playerData/Stat.js';
import StatValues from '../../playerData/StatValues.js';
import {Colors, Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import LivingEntity from '../LivingEntity.js';

class Monster extends LivingEntity {
	constructor(x, y, width, height, health, expValue, materialDrop) {
		super(x, y, width, height, Monster.createBaseStats(health), new StatValues(), IntersectionFinder.Layers.HOSTILE_UNIT);
		this.expValue = expValue;
		this.materialDrop = materialDrop;
		this.modules = [];
	}

	static createBaseStats(health) {
		return new BaseStats({
			[Stat.Ids.LIFE]: [health, 1],
			[Stat.Ids.LIFE_LEECH]: [0, 0],
			[Stat.Ids.SHIELD]: [0, 0],
			[Stat.Ids.ARMOR]: [1, 1],
			[Stat.Ids.TAKING_DAMAGE_OVER_TIME]: [1, 0],
		});
	}

	addModule(module) {
		this.modules.push(module);
		return module;
	}

	update(map, intersectionFinder, monsterKnowledge) {
		this.refresh();
		this.modules.forEach(module => module.poll());
		this.modules.forEach(module => module.apply(map, intersectionFinder, monsterKnowledge.getPlayer()));
	}

	paint(painter, camera) {
		super.paint(painter, camera);
		this.modules.forEach(module => module.paint(painter, camera));
		let transformedHealthCoordinate = camera.transformCoordinates(
			new Coordinate(this.x, this.y - this.height, .1, .01)
				.align(Coordinate.Aligns.CENTER, Coordinate.Aligns.START));
		painter.add(new Bar(
			transformedHealthCoordinate,
			this.health.getRatio(),
			Colors.LIFE.getShade(Colors.BAR_SHADING),
			Colors.LIFE.get(),
			Colors.LIFE.get()));
		if (this.shield.value)
			painter.add(Bar.createFillRect(
				transformedHealthCoordinate,
				this.shield.getRatio(),
				Colors.SHIELD.get()));
	}

	paintUi(painter, camera) {
		painter.add(new Bar(
			new Coordinate(
				Positions.MARGIN,
				Positions.MARGIN,
				1 - Positions.MARGIN * 2,
				Positions.BAR_HEIGHT),
			this.health.getRatio(),
			Colors.LIFE.getShade(Colors.BAR_SHADING),
			Colors.LIFE.get(),
			Colors.LIFE.getShade(Colors.BAR_SHADING)));
		// todo [medium] shield bar
	}
}

export default Monster;

// todo [medium] monster ideas
// circle that puts aoes
// wave generator from edge of map
// snake
// projectile boss
// spear boss
// explosive that only becomes visible when nearby
// laser strolling enemy that only becomes visible when charging & firing
// bull boss - charge while shooting side projectiles, melee stun, melee dmg without delay, ranged splitting smash
