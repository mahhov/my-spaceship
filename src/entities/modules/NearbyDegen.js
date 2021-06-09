import makeEnum from '../../util/enum.js';
import AreaDegen from '../attack/AreaDegen.js';
import Module from './Module.js';

const Stages = makeEnum({WARNING: 0, ACTIVE: 0, INACTIVE: 0});

class NearbyDegen extends Module {
	config(origin, range, damage) {
		this.origin = origin;
		this.areaDegen = new AreaDegen(origin.x, origin.y, range, -1, damage, false);
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.INACTIVE)
			this.areaDegen.setPosition(this.origin.x, this.origin.y);
		if (this.stage === Stages.ACTIVE)
			this.areaDegen.update(map, intersectionFinder);
	}

	paint(painter, camera) {
		if (this.stage !== Stages.INACTIVE)
			this.areaDegen.paint(painter, camera, this.stage === Stages.WARNING);

	}
}

NearbyDegen.Stages = Stages;

export default NearbyDegen;
