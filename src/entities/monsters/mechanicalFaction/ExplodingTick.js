import DiamondShip from '../../../graphics/DiamondShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import {PI} from '../../../util/number.js';
import Aim from '../../modules/Aim.js';
import Chase from '../../modules/Chase.js';
import Distance from '../../modules/Distance.js';
import NearbyDegen from '../../modules/NearbyDegen.js';
import PatternedPeriod from '../../modules/PatternedPeriod.js';
import Monster from '../Monster.js';

class ExplodingTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 60, 100, new MaterialDrop(1, false));
		this.setGraphics(new DiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		let distance = this.addModule(new Distance());
		distance.config(this, .1, 1);
		distance.setStage(Distance.Stages.ACTIVE);

		let patternedPeriod = this.addModule(new PatternedPeriod());
		patternedPeriod.config([0, 60, 60, 60], [[0], [1, 2, 3], [3]], [false, false, true]); // stop, (chase, warn, attack loop), chase
		distance.on('change', segment => {
			let stagePattern = [
				[PatternedPeriod.Stages.LOOP, 1],
				[PatternedPeriod.Stages.PLAY, 2],
				[PatternedPeriod.Stages.STOP, 0],
			][segment];
			patternedPeriod.setStage(stagePattern[0]);
			patternedPeriod.setPattern(stagePattern[1]);
		});

		let aim = this.addModule(new Aim());
		aim.config(this, PI / 20, 50, .1);
		patternedPeriod.onChangeSetModuleStages(aim, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.ACTIVE);

		let chase = this.addModule(new Chase());
		chase.config(this, .003, aim);
		patternedPeriod.onChangeSetModuleStages(chase, Chase.Stages.INACTIVE, Chase.Stages.INACTIVE, Chase.Stages.INACTIVE, Chase.Stages.ACTIVE);

		let degen = this.addModule(new NearbyDegen());
		degen.config(this, .15, .3);
		patternedPeriod.onChangeSetModuleStages(degen, NearbyDegen.Stages.INACTIVE, NearbyDegen.Stages.WARNING, NearbyDegen.Stages.ACTIVE, NearbyDegen.Stages.INACTIVE);

	}
}

export default ExplodingTick;
