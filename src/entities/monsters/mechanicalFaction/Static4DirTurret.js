import Rect4DotsShip from '../../../graphics/Rect4DotsShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import Vector from '../../../util/Vector.js';
import Aim from '../../modules/Aim.js';
import Period from '../../modules/Period.js';
import Shotgun from '../../modules/Shotgun.js';
import Monster from '../Monster.js';

class Static4DirTurret extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 160, 200, new MaterialDrop(1, false));
		this.setGraphics(new Rect4DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		let period = this.addModule(new Period());
		period.config(120, 80); // rest, attack
		period.setStage(Period.Stages.LOOP);

		[
			{x: 1, y: 0},
			{x: 0, y: 1},
			{x: -1, y: 0},
			{x: 0, y: -1},
		].forEach(dir => {
			let aim = this.addModule(new Aim());
			aim.config(this, 0, 0, 0, Vector.fromObj(dir));
			let shotgun = this.addModule(new Shotgun());
			shotgun.config(this, .05, 1, .003, .0001, 100, 4, aim, true);
			period.onChangeSetModuleStages(shotgun, Shotgun.Stages.INACTIVE, Shotgun.Stages.ACTIVE);
		});

	}
}

export default Static4DirTurret;
