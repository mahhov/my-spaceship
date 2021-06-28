import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Bar from '../../painter/elements/Bar.js';
import {Colors, Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import LivingEntity from '../LivingEntity.js';
import ModuleManager from '../modules/ModuleManager.js';

class Monster extends LivingEntity {
	constructor(x, y, width, height, health, expValue) {
		super(x, y, width, height, health, IntersectionFinder.Layers.HOSTILE_UNIT);
		this.expValue = expValue;
		this.moduleManager = new ModuleManager();
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
		painter.add(new Bar(camera.transformCoordinates(new Coordinate(this.x, this.y - this.height, .1, .01).align(Coordinate.Aligns.CENTER, Coordinate.Aligns.START)),
			this.health.getRatio(), Colors.LIFE.getShade(Colors.BAR_SHADING), Colors.LIFE.get(), Colors.LIFE.get()));
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
	}
}

export default Monster;