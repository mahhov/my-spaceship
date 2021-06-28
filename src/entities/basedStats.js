import Stat from '../playerData/Stat.js';

const BaseStats = {
	Player: {
		[Stat.Ids.LIFE]: 80,
		[Stat.Ids.LIFE_REGEN]: .03,
		[Stat.Ids.LIFE_LEECH]: 0, // todo
		[Stat.Ids.STAMINA]: 80,
		[Stat.Ids.STAMINA_REGEN]: .13,
		[Stat.Ids.SHIELD]: 0, // todo
		[Stat.Ids.SHIELD_DELAY]: 0, // todo
		[Stat.Ids.SHIELD_LEECH]: 0, // todo
		[Stat.Ids.ARMOR]: 1,

		[Stat.Ids.DAMAGE]: 0, // todo
		[Stat.Ids.DAMAGE_OVER_TIME]: 0, // todo
		[Stat.Ids.ATTACK_SPEED]: 0, // todo
		[Stat.Ids.ATTACK_RANGE]: 0, // todo
		[Stat.Ids.CRITICAL_CHANCE]: 0, // todo
		[Stat.Ids.CRITICAL_DAMAGE]: 0, // todo

		[Stat.Ids.MOVE_SPEED]: .005,
	},
};

export default BaseStats;
