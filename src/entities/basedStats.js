import Stat from '../playerData/Stat.js';

const BaseStats = {
	Player: {
		[Stat.Ids.LIFE]: 80,
		[Stat.Ids.LIFE_REGEN]: .0003,
		[Stat.Ids.LIFE_LEECH]: 0, // todo
		[Stat.Ids.STAMINA]: 80,
		[Stat.Ids.STAMINA_REGEN]: .13,
	},
};

export default BaseStats;
