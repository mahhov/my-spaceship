import Rect4DotsShip from '../../../graphics/Rect4DotsShip.js';
import {Colors} from '../../../util/constants.js';
import makeEnum from '../../../util/enum.js';
import Phase from '../../../util/Phase.js';
import Vector from '../../../util/Vector.js';
import Aim from '../../modules/Aim.js';
import Period from '../../modules/Period.js';
import Shotgun from '../../modules/Shotgun.js';
import Monster from '.././Monster.js';

const Phases = makeEnum({ONE: 0});

class Static4DirTurret extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 160, 200);
		this.setGraphics(new Rect4DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(120, 80);
		this.moduleManager.addModule(period, {[Phases.ONE]: Period.Stages.LOOP});

		[
			{x: 1, y: 0},
			{x: 0, y: 1},
			{x: -1, y: 0},
			{x: 0, y: -1},
		].forEach(dir => {
			let aim = new Aim();
			aim.config(this, 0, 0, 0, Vector.fromObj(dir));
			period.addModule(aim, {
				0: Aim.Stages.INACTIVE,
				1: Aim.Stages.INACTIVE,
			});

			let shotgun = new Shotgun();
			shotgun.config(this, .05, 1, .003, .0001, 100, 4, aim, true);
			period.addModule(shotgun, {
				0: Shotgun.Stages.INACTIVE,
				1: Shotgun.Stages.ACTIVE,
			});
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

export default Static4DirTurret;
