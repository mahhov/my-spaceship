import DoubleHorizDiamondShip from '../../../graphics/DoubleHorizDiamondShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import makeEnum from '../../../util/enum.js';
import {PI} from '../../../util/number.js';
import Phase from '../../../util/Phase.js';
import Aim from '../../modules/Aim.js';
import AreaDegenLayer from '../../modules/AreaDegenLayer.js';
import Chase from '../../modules/Chase.js';
import Cooldown from '../../modules/Cooldown.js';
import Distance from '../../modules/Distance.js';
import Monster from '.././Monster.js';

const Phases = makeEnum({ONE: 0});

class BombLayer extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 120, 300, new MaterialDrop(1, false));
		this.setGraphics(new DoubleHorizDiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .1, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let aim = new Aim();
		aim.config(this, PI / 80, 80, .2);
		distance.addModule(aim, {
			0: Aim.Stages.REVERSE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, aim);
		distance.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.INACTIVE,
		});

		let cooldown = new Cooldown();
		cooldown.config(80);
		distance.addModule(cooldown, {
			0: Cooldown.Stages.ACTIVE,
			1: Cooldown.Stages.ACTIVE,
			2: Cooldown.Stages.COOLDOWN,
		});

		let areaDegen = new AreaDegenLayer();
		areaDegen.config(this, .1, 200, .3);
		cooldown.addModule(areaDegen, {
			[Cooldown.Phases.UNTRIGGERED]: AreaDegenLayer.Stages.INACTIVE,
			[Cooldown.Phases.TRIGGERED]: AreaDegenLayer.Stages.ACTIVE,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

export default BombLayer;
