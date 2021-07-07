import {rand, randInt} from '../util/number.js';
import BaseStats from './BaseStats.js';
import Material from './Material.js';
import Stat from './Stat.js';

const baseStats = new BaseStats({
	[Stat.Ids.LIFE]: [.1, 10],
	[Stat.Ids.LIFE_REGEN]: [.1, 10],
	[Stat.Ids.LIFE_LEECH]: [.1, 10],
	[Stat.Ids.STAMINA]: [.1, 10],
	[Stat.Ids.STAMINA_REGEN]: [.1, 10],
	[Stat.Ids.STAMINA_GAIN]: [.1, 10],
	[Stat.Ids.SHIELD]: [.1, 10],
	[Stat.Ids.SHIELD_DELAY]: [.1, 10],
	[Stat.Ids.SHIELD_REGEN]: [.1, 10],
	[Stat.Ids.SHIELD_LEECH]: [.1, 10],
	[Stat.Ids.ARMOR]: [.1, 10],
	[Stat.Ids.DAMAGE]: [.1, 10],
	[Stat.Ids.DAMAGE_OVER_TIME]: [.1, 10],
	[Stat.Ids.ATTACK_SPEED]: [.1, 10],
	[Stat.Ids.ATTACK_RANGE]: [.1, 10],
	[Stat.Ids.CRITICAL_CHANCE]: [.1, 10],
	[Stat.Ids.CRITICAL_DAMAGE]: [.1, 10],
	[Stat.Ids.MOVE_SPEED]: [.1, 10],
});

class MaterialDrop {
	constructor(tier, fromBoss) {
		this.tier = tier;
		this.liklihood = tier ? (fromBoss ? 1 : .05) : 0;
		this.maxNumStats = Math.min(Math.floor(tier / 5) + 1, 8);
	}

	get probability() {
		return rand() < this.liklihood;
	}

	get material() {
		let numStats = randInt(this.maxNumStats) + 1;
		let statIds = Object.keys(baseStats.tuples);
		let stats = [...Array(numStats)].map(() => {
			let statId = statIds[randInt(statIds.length)];
			let statValue = baseStats.getBasedStat(statId, this.tier + numStats - 2);
			return new Stat(statId, statValue);
		});
		// todo [medium] generate name from monster type
		return new Material(Material.Types.A, `Tier ${this.tier} material`, stats);
	}
}

export default MaterialDrop;
