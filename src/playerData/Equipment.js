import makeEnum from '../util/enum.js';

const Types = makeEnum({HULL: 0, CIRCUIT: 0, THRUSTER: 0, TURRET: 0});

class Equipment {
	constructor(type, name, stats) {
		this.type = type;
		this.name = name;
		this.stats = stats;
	}
}

Equipment.Types = Types;

export default Equipment;
