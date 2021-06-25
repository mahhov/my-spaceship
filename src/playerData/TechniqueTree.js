import makeEnum from '../util/enum.js';
import {enumName} from '../util/string.js';

const TechniqueIds = makeEnum({
	PROJECTILE_ATTACK: 0,
	AREA_ATTACK: 0,
	DASH: 0,
	DEFENSE: 0,
});

class TechniqueTree {
	constructor(id, allocationSets) {
		this.id = id;
		this.allocationSets = allocationSets;
	}

	get name() {
		return enumName(this.id, TechniqueIds);
	}
}

TechniqueTree.TechniqueIds = TechniqueIds;

export default TechniqueTree;
