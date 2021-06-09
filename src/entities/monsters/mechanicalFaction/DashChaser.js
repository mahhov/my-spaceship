import HexagonShip from '../../../graphics/HexagonShip.js';
import {Colors} from '../../../util/Constants.js';
import makeEnum from '../../../util/enum.js';
import {PI} from '../../../util/number.js';
import Phase from '../../../util/Phase.js';
import Aim from '../../modules/Aim.js';
import Chase from '../../modules/Chase.js';
import Dash from '../../modules/Dash.js';
import Distance from '../../modules/Distance.js';
import NearbyDegen from '../../modules/NearbyDegen.js';
import Period from '../../modules/Period.js';
import Trigger from '../../modules/Trigger.js';
import Monster from '.././Monster.js';

const Phases = makeEnum({ONE: 0});

class DashChaser extends Monster {
	constructor(x, y) {
		super(x, y, .06, .06, 1.2);
		this.setGraphics(new HexagonShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .8, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let period = new Period();
		period.config(125, 35, 15, 20, 1);
		distance.addModule(period, {
			0: Period.Stages.LOOP,
			1: Period.Stages.PLAY,
			2: Period.Stages.PLAY,
		});

		let aim = new Aim();
		aim.config(this, PI / 80, 80, .2);
		period.addModule(aim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
			4: Aim.Stages.ACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .002, aim);
		period.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.INACTIVE,
			4: Chase.Stages.ACTIVE,
		});

		let dash = new Dash();
		dash.config(this, .25, 20);
		period.addModule(dash, {
			0: Dash.Stages.INACTIVE,
			1: Dash.Stages.AIMING,
			2: Dash.Stages.WARNING,
			3: Dash.Stages.DASHING,
			4: Dash.Stages.INACTIVE,
		});

		let triggerDashEnd = new Trigger();
		triggerDashEnd.config(1);
		dash.addModule(triggerDashEnd, {
			[Dash.Phases.INACTIVE]: Trigger.Stages.ACTIVE,
			[Dash.Phases.AIMING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.WARNING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.DASHING]: Trigger.Stages.INACTIVE,
		});

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.config(dash.target, .15, .06);
		triggerDashEnd.addModule(nearbyDegen, {
			[Trigger.Phases.UNTRIGGERED]: NearbyDegen.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: NearbyDegen.Stages.ACTIVE,
		});
		dash.addModule(nearbyDegen, {
			[Dash.Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Dash.Phases.AIMING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.WARNING]: NearbyDegen.Stages.WARNING,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

export default DashChaser;
