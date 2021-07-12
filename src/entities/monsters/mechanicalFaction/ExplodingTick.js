import DiamondShip from '../../../graphics/DiamondShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import {PI} from '../../../util/number.js';
import Aim from '../../modules2/Aim.js';
import Chase from '../../modules2/Chase.js';
import Distance from '../../modules2/Distance.js';
import NearbyDegen from '../../modules2/NearbyDegen.js';
import PatternedPeriod from '../../modules2/PatternedPeriod.js';
import Monster from '../Monster.js';

class ExplodingTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 60, 100, new MaterialDrop(1, false));
		this.setGraphics(new DiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		let distance = this.addModule(new Distance());
		distance.config(this, .1, 1);
		distance.setStage(Distance.Stages.ACTIVE);

		let patternedPeriod = this.addModule(new PatternedPeriod());
		patternedPeriod.config([0, 60, 60, 60], [[0], [1, 2, 3], [3]], [false, false, true]);
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

		let chase = this.addModule(new Chase());
		chase.config(this, .003, aim);

		let degen = this.addModule(new NearbyDegen());
		degen.config(this, .15, .3);

		patternedPeriod.on('change', period => {
			let degenStage = [
				NearbyDegen.Stages.INACTIVE,
				NearbyDegen.Stages.WARNING,
				NearbyDegen.Stages.ACTIVE,
				NearbyDegen.Stages.INACTIVE,
			][period];
			degen.setStage(degenStage);
			aim.setStage(period === 3 ? Aim.Stages.ACTIVE : Aim.Stages.INACTIVE);
			chase.setStage(period === 3 ? Chase.Stages.ACTIVE : Chase.Stages.INACTIVE);
		});
	}
}

export default ExplodingTick;
