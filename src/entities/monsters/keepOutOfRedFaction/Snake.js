import SnakeShip from '../../../graphics/SnakeShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import {PI} from '../../../util/number.js';
import Vector from '../../../util/Vector.js';
import Aim from '../../modules/Aim.js';
import AreaDegenLayer from '../../modules/AreaDegenLayer.js';
import Chase from '../../modules/Chase.js';
import Distance from '../../modules/Distance.js';
import Period from '../../modules/Period.js';
import Position from '../../modules/Position.js';
import Monster from '../Monster.js';

class Snake extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 160, 200, new MaterialDrop(1, false));
		this.setGraphics(new SnakeShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		let distance = this.addModule(new Distance(this, .1));
		distance.setStage(Distance.Stages.ACTIVE);

		let aim = this.addModule(new Aim(this, PI / 80, 80, .2, new Vector(0, 0)));
		distance.onChangeSetModuleStages(aim, Aim.Stages.REVERSE, Aim.Stages.ACTIVE);

		let chase = this.addModule(new Chase(this, .003, aim));
		chase.setStage(Chase.Stages.ACTIVE);

		let period = this.addModule(new Period(1, 80, 80));
		period.setStage(Period.Stages.LOOP);

		for (let x = -1; x < 2; x++)
			for (let y = -1; y < 2; y++)
				if (x !== 0 || y !== 0) {
					let position = this.addModule(new Position(this, 0, 0, new Vector(x, y).multiply(.2)));
					position.setStage(Position.Stages.ACTIVE);
					let areaDegen = this.addModule(new AreaDegenLayer(position, .01, 10, .09));
					areaDegen.setStage(AreaDegenLayer.Stages.ACTIVE);
				}
	}
}

export default Snake;
