import SkillItem from './SkillsItem.js';
import Stat from './Stat.js';

class SkillsData {
	constructor() {
		this.skillItems = [
			new SkillItem('life', [
				new Stat(Stat.Ids.LIFE, 5),
			], 0, 4, '+5% max life'),
			new SkillItem('heavy armor', [
				new Stat(Stat.Ids.ARMOR, 5),
				new Stat(Stat.Ids.MOVE_SPEED, -5),
			], 0, 4, '+10% armor; -5% move speed'),

			//life
			// lifeRegen
			// armour
			// shield
			// damage
			// attackSpeed
			// criticalChance
			// criticalDamage
			// stamina
			// staminaRegen
			// marksman
			// puncture
			// heavyStrike
			// farShot
			// lifeLeech
			// shieldLeech


		];
	}
}

export default SkillsData;
