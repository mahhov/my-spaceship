import makeEnum from '../util/enum.js';
import {enumName} from '../util/string.js';

const Ids = makeEnum({
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

	setImageName(imageName) {
		this.imageName = imageName;
		return this;
	}

	get name() {
		return enumName(this.id, Ids);
	}
}

TechniqueTree.Ids = Ids;

export default TechniqueTree;
