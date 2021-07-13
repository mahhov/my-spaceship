import HexagonShip from '../../../graphics/HexagonShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import {PI} from '../../../util/number.js';
import Aim from '../../modules/Aim.js';
import Chase from '../../modules/Chase.js';
import Dash from '../../modules/Dash.js';
import Distance from '../../modules/Distance.js';
import NearbyDegen from '../../modules/NearbyDegen.js';
import Period from '../../modules/Period.js';
import Trigger from '../../modules/Trigger.js';
import Monster from '../Monster.js';

class DashChaser extends Monster {
	constructor(x, y) {
		super(x, y, .06, .06, 120, 360, new MaterialDrop(1, false));
		this.setGraphics(new HexagonShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		let distance = this.addModule(new Distance());
		distance.config(this, .8, 1);
		distance.setStage(Distance.Stages.ACTIVE);

		let period = this.addModule(new Period());
		period.config(125, 35, 15, 20, 1); // chase, aim, warn, dashing until collided, inactive
		distance.onChangeSetModuleStages([period, Period.Stages.LOOP, Period.Stages.PLAY, Period.Stages.PLAY]);

		let chaseAim = this.addModule(new Aim());
		chaseAim.config(this, PI / 80, 80, .2);

		let chase = this.addModule(new Chase());
		chase.config(this, .002, chaseAim);

		let dash = this.addModule(new Dash());
		dash.config(this, .25, 20);

		let dashEndTrigger = this.addModule(new Trigger());
		dashEndTrigger.config(1);
		dash.on('collide', () => dashEndTrigger.setStage(Trigger.Stages.ACTIVE));

		let nearbyDegen = this.addModule(new NearbyDegen());
		nearbyDegen.config(dash.target, .15, 6);
		dashEndTrigger.on('trigger', () => nearbyDegen.setStage(NearbyDegen.Stages.ACTIVE));
		dashEndTrigger.on('end-trigger', () => nearbyDegen.setStage(NearbyDegen.Stages.INACTIVE));

		period.onChangeSetModuleStages(
			[chaseAim, Aim.Stages.ACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.ACTIVE],
			[chase, Chase.Stages.ACTIVE, Chase.Stages.INACTIVE, Chase.Stages.INACTIVE, Chase.Stages.INACTIVE, Chase.Stages.ACTIVE],
			[dash, Dash.Stages.INACTIVE, Dash.Stages.AIMING, Dash.Stages.WARNING, Dash.Stages.DASHING, Dash.Stages.INACTIVE],
			[dashEndTrigger, null, null, null, Trigger.Stages.INACTIVE, Trigger.Stages.ACTIVE],
			[nearbyDegen, null, NearbyDegen.Stages.WARNING, NearbyDegen.Stages.WARNING, null, null],
		);
	}
}

export default DashChaser;
