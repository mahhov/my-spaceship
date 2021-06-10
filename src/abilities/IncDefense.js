import Buff from '../entities/Buff.js';
import Stat from '../playerData/Stat.js';
import Ability from './Ability.js';

class IncDefense extends Ability {
	constructor() {
		super('Armor', 600, 1, 0, false, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		this.buff = new Buff(200, this.uiColor, 'Armor');
		this.buff.setEffect(Stat.Ids.ARMOR, 3);
		hero.addBuff(this.buff);
		return true;
	}
}

export default IncDefense;
