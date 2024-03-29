import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Bar from '../../painter/elements/Bar.js';
import BaseStats from '../../playerData/BaseStats.js';
import Stat from '../../playerData/Stat.js';
import StatValues from '../../playerData/StatValues.js';
import {Colors, Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import LivingEntity from '../LivingEntity.js';
import ModuleManager from '../modulesDeprecated/ModuleManager.js';

class MonsterDeprecated extends LivingEntity {
	constructor(x, y, width, height, health, expValue, materialDrop) {
		super(x, y, width, height, MonsterDeprecated.createBaseStats(health), new StatValues(), IntersectionFinder.Layers.HOSTILE_UNIT);
		this.expValue = expValue;
		this.materialDrop = materialDrop;
		this.moduleManager = new ModuleManager();
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

	update(map, intersectionFinder, monsterKnowledge) {
		this.refresh();
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}

	paint(painter, camera) {
		super.paint(painter, camera);
		this.moduleManager.paint(painter, camera);
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

export default MonsterDeprecated;
