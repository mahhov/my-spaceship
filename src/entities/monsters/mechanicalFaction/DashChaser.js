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

		let distance = this.addModule(new Distance(this, .8, 1));
		distance.setStage(Distance.Stages.ACTIVE);

		let period = this.addModule(new Period(125, 35, 15, 20, 1)); // chase, aim, warn, dashing until collided, inactive
		distance.onChangeSetModuleStages(period, Period.Stages.LOOP, Period.Stages.PLAY, Period.Stages.PLAY);

		let chaseAim = this.addModule(new Aim(this, PI / 80, 80, .2));
		period.onChangeSetModuleStages(chaseAim, Aim.Stages.ACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.ACTIVE);

		let chase = this.addModule(new Chase(this, .002, chaseAim));
		period.onChangeSetModuleStages(chase, Chase.Stages.ACTIVE, Chase.Stages.INACTIVE, Chase.Stages.INACTIVE, Chase.Stages.INACTIVE, Chase.Stages.ACTIVE);

		let dash = this.addModule(new Dash(this, .25, 20));
		period.onChangeSetModuleStages(dash, Dash.Stages.INACTIVE, Dash.Stages.AIMING, Dash.Stages.WARNING, Dash.Stages.DASHING, Dash.Stages.INACTIVE);

		let dashEndTrigger = this.addModule(new Trigger(1));
		dash.on('collide', () => dashEndTrigger.setStage(Trigger.Stages.ACTIVE));
		period.onChangeSetModuleStages(dashEndTrigger, null, null, null, Trigger.Stages.INACTIVE, Trigger.Stages.ACTIVE);

		let nearbyDegen = this.addModule(new NearbyDegen(dash.target, .15, 6));
		dashEndTrigger.on('trigger', () => nearbyDegen.setStage(NearbyDegen.Stages.ACTIVE));
		dashEndTrigger.on('end-trigger', () => nearbyDegen.setStage(NearbyDegen.Stages.INACTIVE));
		period.onChangeSetModuleStages(nearbyDegen, null, NearbyDegen.Stages.WARNING, NearbyDegen.Stages.WARNING, null, null);
	}
}

export default DashChaser;
