import makeEnum from '../util/enum.js';

const Ids = makeEnum({
	LIFE: 0,
	LIFE_REGEN: 0,
	ARMOUR: 0,
	SHIELD: 0,
	DAMAGE: 0,
	ATTACK_SPEED: 0,
	CRITICAL_CHANCE: 0,
	CRITICAL_DAMAGE: 0,
	STAMINA: 0,
	STAMINA_REGEN: 0,
	MARKSMAN: 0,
	PUNCTURE: 0,
	HEAVY_STRIKE: 0,
	FAR_SHOT: 0,
	LIFE_LEECH: 0,
	SHIELD_LEECH: 0,
});

// Generic class used by skills, equipment, and abilities.
class Stat {
	constructor(id, scale, value = 0) {
		this.id = id;
		this.scale = scale;
		this.value = value;
	}
}

Stat.Ids = Ids;

export default Stat;
