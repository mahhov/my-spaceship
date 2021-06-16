import makeEnum from '../util/enum.js';

const Types = makeEnum({A: 0});

class Material {
	constructor(type, name, stats) {
		this.type = type;
		this.name = name;
		this.stats = stats;
	}
}

Material.Types = Types;

export default Material;
