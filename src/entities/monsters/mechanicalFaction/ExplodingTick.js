import DiamondShip from '../../../graphics/DiamondShip.js';
import {Colors} from '../../../util/constants.js';
import makeEnum from '../../../util/enum.js';
import {PI} from '../../../util/number.js';
import Phase from '../../../util/Phase.js';
import Aim from '../../modules/Aim.js';
import Chase from '../../modules/Chase.js';
import Distance from '../../modules/Distance.js';
import NearbyDegen from '../../modules/NearbyDegen.js';
import PatternedPeriod from '../../modules/PatternedPeriod.js';
import Monster from '.././Monster.js';

const Phases = makeEnum({ONE: 0});

class ExplodingTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 60, 100);
		this.setGraphics(new DiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .1, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let patternedPeriod = new PatternedPeriod();
		patternedPeriod.config([0, 60, 60, 60], [[0], [1, 2, 3], [3]], [false, false, true]);
		distance.addModule(patternedPeriod, {
			0: [PatternedPeriod.PrimaryStages.LOOP, 1],
			1: [PatternedPeriod.PrimaryStages.PLAY, 2],
			2: [PatternedPeriod.PrimaryStages.STOP],
		});

		let aim = new Aim();
		aim.config(this, PI / 20, 50, .1);
		patternedPeriod.addModule(aim, {
			0: Aim.Stages.INACTIVE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.ACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, aim);
		patternedPeriod.addModule(chase, {
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.ACTIVE,
		});

		let degen = new NearbyDegen();
		degen.config(this, .15, .3);
		patternedPeriod.addModule(degen, {
			0: NearbyDegen.Stages.INACTIVE,
			1: NearbyDegen.Stages.WARNING,
			2: NearbyDegen.Stages.ACTIVE,
			3: NearbyDegen.Stages.INACTIVE,
		});

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

export default ExplodingTick;
