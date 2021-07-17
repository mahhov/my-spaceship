import DoubleHorizDiamondShip from '../../../graphics/DoubleHorizDiamondShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import {PI} from '../../../util/number.js';
import Aim from '../../modules/Aim.js';
import AreaDegenLayer from '../../modules/AreaDegenLayer.js';
import Chase from '../../modules/Chase.js';
import Cooldown from '../../modules/Cooldown.js';
import Distance from '../../modules/Distance.js';
import Monster from '../Monster.js';

class BombLayer extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 120, 300, new MaterialDrop(1, false));
		this.setGraphics(new DoubleHorizDiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		let distance = this.addModule(new Distance(this, .1, 1));
		distance.setStage(Distance.Stages.ACTIVE);

		let aim = this.addModule(new Aim(this, PI / 80, 80, .2));
		distance.onChangeSetModuleStages(aim, Aim.Stages.REVERSE, Aim.Stages.ACTIVE, Aim.Stages.INACTIVE);

		let chase = this.addModule(new Chase(this, .003, aim));
		distance.onChangeSetModuleStages(chase, Chase.Stages.ACTIVE, Chase.Stages.ACTIVE, Chase.Stages.INACTIVE);

		let cooldown = this.addModule(new Cooldown((80)));
		distance.onChangeSetModuleStages(cooldown, Cooldown.Stages.ACTIVE, Cooldown.Stages.ACTIVE, Cooldown.Stages.COOLDOWN);

		let areaDegen = this.addModule(new AreaDegenLayer(this, .1, 200, .3));
		cooldown.on('trigger', () => areaDegen.setStage(AreaDegenLayer.Stages.ACTIVE));
		cooldown.on('post-trigger', () => areaDegen.setStage(AreaDegenLayer.Stages.INACTIVE));
	}
}

export default BombLayer;
