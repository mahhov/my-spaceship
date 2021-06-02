import StarShip from '../../graphics/StarShip.js';
import {Colors} from '../../util/Constants.js';
import makeEnum from '../../util/Enum.js';
import Phase from '../../util/Phase.js';
import NearbyDegen from '../modules/NearbyDegen.js';
import Monster from './Monster.js';

const Phases = makeEnum('REST', 'ATTACK');

class Turret extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 4);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(200, 200);
		this.attackPhase.setRandomTick();

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.config(this, .4, .001);
		this.moduleManager.addModule(nearbyDegen, {
			[Phases.REST]: NearbyDegen.Stages.INACTIVE,
			[Phases.ATTACK]: NearbyDegen.Stages.ACTIVE
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

export default Turret;
